import Stripe from 'stripe';
import {NextResponse} from 'next/server';
import {currentAccount} from '../../../../lib/account';
import {db} from '../../../../lib/db';
import {privateHeaders} from '../../../../lib/http';

export async function GET(req:Request){
  const account=await currentAccount();
  if(!account||account.profile.role!=='passenger')return NextResponse.json({error:'Unauthorized'},{status:401,headers:privateHeaders});
  const rideId=new URL(req.url).searchParams.get('ride');
  if(!rideId)return NextResponse.json({error:'Ride number is required'},{status:400,headers:privateHeaders});
  const{data}=await db().from('ride_requests').select('payment_status,stripe_payment_intent_id').eq('id',rideId).eq('passenger_id',account.user.id).single();
  if(!data||data.payment_status!=='paid'||!data.stripe_payment_intent_id)return NextResponse.json({error:'Receipt is not available'},{status:404,headers:privateHeaders});
  const key=process.env.STRIPE_SECRET_KEY;
  if(!key)return NextResponse.json({error:'Receipt service is unavailable'},{status:503,headers:privateHeaders});
  try{
    const intent=await new Stripe(key).paymentIntents.retrieve(data.stripe_payment_intent_id,{expand:['latest_charge']});
    const charge=typeof intent.latest_charge==='object'?intent.latest_charge:null;
    const url=charge&&'receipt_url'in charge?charge.receipt_url:null;
    if(!url||!url.startsWith('https://pay.stripe.com/receipts/'))return NextResponse.json({error:'Receipt is not available'},{status:404,headers:privateHeaders});
    return NextResponse.redirect(url,{headers:privateHeaders});
  }catch{return NextResponse.json({error:'Receipt is not available'},{status:404,headers:privateHeaders})}
}
