import Stripe from 'stripe';
import {db} from '../../../../lib/db';
import {currentAccount} from '../../../../lib/account';
import {privateJson,sameOrigin} from '../../../../lib/http';

export async function POST(req:Request){
  try{
    if(!sameOrigin(req))return privateJson({error:'Forbidden'},{status:403});
    const account=await currentAccount();
    if(!account||account.profile.role!=='passenger')return privateJson({error:'Sign in to pay for this ride.'},{status:401});
    const{rideRequestId}=await req.json();
    if(typeof rideRequestId!=='string')return privateJson({error:'Ride request is required.'},{status:400});
    const service=db();
    const{data,error}=await service.from('ride_requests').select('id,passenger_id,status,pickup,dropoff,fare_locked,locked_fare_cents,payment_method,payment_status,stripe_checkout_session_id').eq('id',rideRequestId).eq('passenger_id',account.user.id).single();
    if(error||!data)return privateJson({error:'Ride request not found'},{status:404});
    if(!data.fare_locked||!data.locked_fare_cents)return privateJson({error:'Dispatch has not locked the final fare yet.'},{status:409});
    if(['Canceled','Completed'].includes(data.status))return privateJson({error:'Online payment is closed for this ride. Contact A2B for help.'},{status:409});
    if(data.payment_status==='paid')return privateJson({error:'Ride is already paid'},{status:409});
    if(data.payment_status==='refunded')return privateJson({error:'This ride was refunded. Contact A2B to arrange payment.'},{status:409});
    const key=process.env.STRIPE_SECRET_KEY;
    if(!key)return privateJson({error:'Online card payment is temporarily unavailable. Choose cash or contact A2B.'},{status:503});
    const stripe=new Stripe(key);
    if(data.stripe_checkout_session_id&&data.payment_status==='pending'){
      const existing=await stripe.checkout.sessions.retrieve(data.stripe_checkout_session_id).catch(()=>null);
      if(existing?.status==='open'&&existing.url)return privateJson({url:existing.url});
    }
    const configured=process.env.SITE_URL;
    const origin=configured?new URL(configured).origin:new URL(req.url).origin;
    const session=await stripe.checkout.sessions.create({
      mode:'payment',
      customer_creation:'always',
      customer_email:account.user.email||undefined,
      line_items:[{quantity:1,price_data:{currency:'usd',unit_amount:data.locked_fare_cents,product_data:{name:'A2B RIDES transportation',description:`Ride ${data.id}`}}}],
      metadata:{ride_request_id:String(data.id),passenger_id:account.user.id},
      payment_intent_data:{description:`A2B RIDES ${data.id}`,metadata:{ride_request_id:String(data.id),passenger_id:account.user.id}},
      expires_at:Math.floor(Date.now()/1000)+30*60,
      success_url:`${origin}/passenger?payment=success`,
      cancel_url:`${origin}/passenger?payment=canceled`,
    },{idempotencyKey:`ride-${data.id}-${data.locked_fare_cents}-${Math.floor(Date.now()/(30*60*1000))}`});
    const{error:updateError}=await service.from('ride_requests').update({stripe_checkout_session_id:session.id,payment_method:'card',payment_status:'pending',updated_at:new Date().toISOString()}).eq('id',data.id).eq('passenger_id',account.user.id);
    if(updateError)throw updateError;
    return privateJson({url:session.url});
  }catch(error){
    console.error('Stripe checkout failed',error instanceof Error?error.message:error);
    return privateJson({error:'Unable to start secure payment. Please try again or contact A2B.'},{status:500});
  }
}
