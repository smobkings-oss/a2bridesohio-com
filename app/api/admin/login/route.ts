import {NextResponse} from 'next/server';
import {adminCookieName,adminCookieValue,adminSessionSeconds,credentialsMatch} from '../../../../lib/auth';
import {privateHeaders,sameOrigin} from '../../../../lib/http';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403,headers:privateHeaders});
  let pin:unknown;
  try{({pin}=await req.json())}catch{return NextResponse.json({error:'Invalid request'},{status:400,headers:privateHeaders})}
  if(!credentialsMatch(pin))return NextResponse.json({error:'Invalid credentials'},{status:401,headers:privateHeaders});
  const response=NextResponse.json({ok:true},{headers:privateHeaders});
  response.cookies.set(adminCookieName,adminCookieValue(),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:adminSessionSeconds});
  return response;
}

export async function DELETE(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403,headers:privateHeaders});
  const response=NextResponse.json({ok:true},{headers:privateHeaders});
  response.cookies.set(adminCookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0});
  return response;
}
