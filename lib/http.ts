import {NextResponse} from 'next/server';

export const privateHeaders={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache'};

export function privateJson(body:unknown,init:ResponseInit={}){
  return NextResponse.json(body,{...init,headers:{...privateHeaders,...init.headers}});
}

export function sameOrigin(req:Request){
  const origin=req.headers.get('origin');
  if(!origin)return true;
  const allowed=new Set([new URL(req.url).origin]);
  const configured=process.env.SITE_URL;
  if(configured){try{allowed.add(new URL(configured).origin)}catch{}}
  return allowed.has(origin);
}
