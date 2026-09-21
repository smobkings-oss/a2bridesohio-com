import Stripe from 'stripe';
import {NextResponse} from 'next/server';
import {db} from '../../../../../lib/db';

export const runtime='nodejs';

export async function POST(req:Request){
  const key=process.env.STRIPE_SECRET_KEY,secret=process.env.STRIPE_WEBHOOK_SECRET;
  if(!key||!secret)return NextResponse.json({error:'Stripe webhook not configured'},{status:503});
  const stripe=new Stripe(key),body=await req.text(),signature=req.headers.get('stripe-signature');
  if(!signature)return NextResponse.json({error:'Missing signature'},{status:400});
  let event:Stripe.Event;
  try{event=stripe.webhooks.constructEvent(body,signature,secret)}catch{return NextResponse.json({error:'Invalid signature'},{status:400})}
  try{
    const service=db();
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
      const session=event.data.object as Stripe.Checkout.Session,id=session.metadata?.ride_request_id;
      if(id&&session.payment_status==='paid'){
        const{data:ride}=await service.from('ride_requests').select('id,locked_fare_cents,stripe_checkout_session_id').eq('id',id).single();
        if(!ride||ride.stripe_checkout_session_id!==session.id||ride.locked_fare_cents!==session.amount_total||session.currency!=='usd')return NextResponse.json({error:'Payment details did not match the ride.'},{status:409});
        const{error}=await service.from('ride_requests').update({payment_status:'paid',status:'Scheduled',payment_method:'card',stripe_payment_intent_id:String(session.payment_intent||''),paid_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('stripe_checkout_session_id',session.id);
        if(error)throw error;
      }
    }else if(event.type==='checkout.session.expired'||event.type==='checkout.session.async_payment_failed'){
      const session=event.data.object as Stripe.Checkout.Session,id=session.metadata?.ride_request_id;
      if(id){
        const{error}=await service.from('ride_requests').update({payment_status:event.type==='checkout.session.expired'?'unpaid':'failed',stripe_checkout_session_id:event.type==='checkout.session.expired'?null:session.id,updated_at:new Date().toISOString()}).eq('id',id).eq('stripe_checkout_session_id',session.id).eq('payment_status','pending');
        if(error)throw error;
      }
    }else if(event.type==='charge.refunded'){
      const charge=event.data.object as Stripe.Charge;
      if(typeof charge.payment_intent==='string'&&charge.refunded){
        const{error}=await service.from('ride_requests').update({payment_status:'refunded',updated_at:new Date().toISOString()}).eq('stripe_payment_intent_id',charge.payment_intent);
        if(error)throw error;
      }
    }else if(event.type==='payment_intent.payment_failed'){
      const intent=event.data.object as Stripe.PaymentIntent;
      const rideId=intent.metadata?.ride_request_id;
      if(rideId){
        const{error}=await service.from('ride_requests').update({payment_status:'failed',stripe_payment_intent_id:intent.id,updated_at:new Date().toISOString()}).eq('id',rideId).neq('payment_status','paid');
        if(error)throw error;
      }
    }
    return NextResponse.json({received:true});
  }catch(error){
    console.error('Stripe webhook processing failed',event.id,error instanceof Error?error.message:error);
    return NextResponse.json({error:'Webhook processing failed'},{status:500});
  }
}
