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
  const{data:profile}=await db().from('profiles').select('id,role,name,phone').eq('id',user.id).maybeSingle();
  if(!profile)return null;
  return{user,profile};
}
