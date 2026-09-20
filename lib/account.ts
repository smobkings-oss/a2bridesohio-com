import {cookies} from 'next/headers';
import {createServerClient} from '@supabase/ssr';
import {db} from './db';

function publicConfig(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
    ||process.env.NEXT_PUBLIC_A2B_SUPABASE_URL
    ||process.env.NEXT_PUBLIC_A2B_SUPABASE_SUPABASE_URL
    ||process.env.A2B_SUPABASE_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ||process.env.NEXT_PUBLIC_A2B_SUPABASE_ANON_KEY
    ||process.env.NEXT_PUBLIC_A2B_SUPABASE_SUPABASE_ANON_KEY
    ||process.env.A2B_SUPABASE_SUPABASE_ANON_KEY;
  if(!url||!key)throw new Error('Account service is not configured');
  return{url,key};
}

export async function accountClient(){
  const store=await cookies();
  const{url,key}=publicConfig();
  return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll(values:{name:string;value:string;options:any}[]){for(const value of values)store.set(value.name,value.value,value.options)}}});
}

export async function currentAccount(){
  const auth=await accountClient();
  const{data:{user}}=await auth.auth.getUser();
  if(!user)return null;
  let{data:profile}=await db().from('profiles').select('id,role,name,phone').eq('id',user.id).maybeSingle();
  if(!profile&&user.email_confirmed_at&&user.user_metadata?.role==='driver'){
    const service=db();const{data:application}=await service.from('driver_applications').select('id,name,phone,email,vehicle').eq('email',user.email).eq('status','Approved').limit(1).maybeSingle();
    if(application){
      const{error}=await service.from('drivers').upsert({user_id:user.id,application_id:application.id,name:application.name,phone:application.phone,email:application.email,vehicle:application.vehicle},{onConflict:'user_id'});
      if(!error){await service.from('profiles').upsert({id:user.id,role:'driver',name:application.name,phone:application.phone},{onConflict:'id'});profile=(await service.from('profiles').select('id,role,name,phone').eq('id',user.id).maybeSingle()).data;}
    }
  }
  if(!profile)return null;
  return{user,profile};
}
