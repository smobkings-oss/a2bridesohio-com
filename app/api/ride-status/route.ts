import {db} from '../../../lib/db';
import {currentAccount} from '../../../lib/account';
import {privateJson} from '../../../lib/http';
import {passengerRide} from '../../../lib/ride-privacy';

export async function GET(req:Request){
  const account=await currentAccount();
  if(!account||account.profile.role!=='passenger')return privateJson({error:'Unauthorized'},{status:401});
  const id=new URL(req.url).searchParams.get('id');
  if(!id)return privateJson({error:'Missing ride number'},{status:400});
  const{data,error}=await db().from('ride_requests').select('id,status,fare_locked,locked_fare_cents,fare_estimate_cents,payment_status,payment_method').eq('id',id).eq('passenger_id',account.user.id).single();
  if(error||!data)return privateJson({error:'Booking not found'},{status:404});
  return privateJson(passengerRide(data));
}
