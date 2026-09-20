import{NextResponse}from'next/server';
import{accountClient,currentAccount}from'../../../lib/account';
import{db}from'../../../lib/db';
import{sameOrigin}from'../../../lib/http';

const clean=(v:unknown,n:number)=>String(v||'').trim().slice(0,n);

export async function GET(){
  const account=await currentAccount();
  if(!account)return NextResponse.json({account:null});
  return NextResponse.json({account:{id:account.user.id,email:account.user.email,role:account.profile.role,name:account.profile.name,phone:account.profile.phone}});
}

export async function POST(req:Request){
  try{
    if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
    const x=await req.json();
    const action=clean(x.action,20);
    const auth=await accountClient();
    if(action==='logout'){
      await auth.auth.signOut();
      return NextResponse.json({ok:true});
    }
    const email=clean(x.email,180).toLowerCase(),password=String(x.password||'');
    if(!/^\S+@\S+\.\S+$/.test(email)||password.length<8)return NextResponse.json({error:'Enter a valid email and a password with at least 8 characters.'},{status:400});
    if(action==='login'){
      const{data,error}=await auth.auth.signInWithPassword({email,password});
      if(error||!data.user)return NextResponse.json({error:'Email or password is incorrect.'},{status:401});
      const profile=(await currentAccount())?.profile;
      if(!profile){await auth.auth.signOut();return NextResponse.json({error:'This account is not ready. Contact A2B RIDES.'},{status:403})}
      return NextResponse.json({ok:true,role:profile.role});
    }
    if(action!=='signup')return NextResponse.json({error:'Invalid action.'},{status:400});
    const role=x.role==='driver'?'driver':'passenger',name=clean(x.name,120),phone=clean(x.phone,40);
    if(!name||!phone)return NextResponse.json({error:'Name and phone are required.'},{status:400});
    let application:any=null;
    if(role==='driver'){
      const result=await db().from('driver_applications').select('id,name,phone,email,vehicle,status').eq('email',email).eq('status','Approved').order('created_at',{ascending:false}).limit(1).maybeSingle();
      application=result.data;
      if(!application)return NextResponse.json({error:'Your driver application must be approved before you can create a driver account.'},{status:403});
      const{data,error}=await auth.auth.signUp({email,password,options:{data:{role:'driver',name}}});
      if(error)return NextResponse.json({error:'Driver email verification could not be sent. Contact A2B.'},{status:503});
      if(data.session){await auth.auth.signOut();return NextResponse.json({error:'Driver access requires verified enrollment. Contact A2B.'},{status:403});}
      return NextResponse.json({verificationRequired:true,message:'Check your email to verify ownership, then return here and sign in. Driver access requires an approved application.'});
    }
    const service=db();
    const{data:created,error:createError}=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,name}});
    if(createError||!created.user)return NextResponse.json({error:createError?.message.includes('registered')?'An account already exists for this email. Sign in instead.':'Unable to create account.'},{status:400});
    const profile={id:created.user.id,role,name,phone};
    const{error:profileError}=await service.from('profiles').insert(profile);
    if(profileError){await service.auth.admin.deleteUser(created.user.id);throw profileError}
    const{error:loginError}=await auth.auth.signInWithPassword({email,password});
    if(loginError)throw loginError;
    return NextResponse.json({ok:true,role},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to manage account.'},{status:500})}
}
