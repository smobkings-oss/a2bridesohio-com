import{NextResponse}from'next/server';
import{accountClient,currentAccount}from'../../../lib/account';
import{db}from'../../../lib/db';

const clean=(v:unknown,n:number)=>String(v||'').trim().slice(0,n);

export async function GET(){
  const account=await currentAccount();
  if(!account)return NextResponse.json({account:null});
  return NextResponse.json({account:{id:account.user.id,email:account.user.email,role:account.profile.role,name:account.profile.name,phone:account.profile.phone}});
}

export async function POST(req:Request){
  try{
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
      const{data:profile}=await db().from('profiles').select('role').eq('id',data.user.id).maybeSingle();
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
    }
    const service=db();
    const{data:created,error:createError}=await service.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role,name}});
    if(createError||!created.user)return NextResponse.json({error:createError?.message.includes('registered')?'An account already exists for this email. Sign in instead.':'Unable to create account.'},{status:400});
    const profile={id:created.user.id,role,name:role==='driver'?application.name:name,phone:role==='driver'?application.phone:phone};
    const{error:profileError}=await service.from('profiles').insert(profile);
    if(profileError){await service.auth.admin.deleteUser(created.user.id);throw profileError}
    if(role==='driver'){
      const{error}=await service.from('drivers').insert({user_id:created.user.id,application_id:application.id,name:application.name,phone:application.phone,email,vehicle:application.vehicle,status:'Offline'});
      if(error){await service.from('profiles').delete().eq('id',created.user.id);await service.auth.admin.deleteUser(created.user.id);throw error}
    }
    const{error:loginError}=await auth.auth.signInWithPassword({email,password});
    if(loginError)throw loginError;
    return NextResponse.json({ok:true,role},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to manage account.'},{status:500})}
}
