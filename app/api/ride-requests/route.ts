import {randomBytes} from 'crypto';
import {NextResponse} from 'next/server';
import {currentAccount} from '../../../lib/account';
import {isAdmin} from '../../../lib/auth';
import {db} from '../../../lib/db';
import {dispatchRide} from '../../../lib/dispatch';
import {sameOrigin} from '../../../lib/http';
import {priceTrip} from '../../../lib/pricing';
import {routeMetrics} from '../../../lib/routes';

export async function POST(req:Request){
  try{
    if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
    const account=await currentAccount();
    if(!account||account.profile.role!=='passenger')return NextResponse.json({error:'Create or sign in to your passenger account before booking.'},{status:401});
    const input=await req.json();
    for(const key of['pickup','dropoff','date','time'])if(!input[key])return NextResponse.json({error:`${key} is required`},{status:400});
    if(!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))return NextResponse.json({error:'Enter a valid pickup date and time.'},{status:400});
    const passengers=Number(input.passengers||1);
    if(!Number.isInteger(passengers)||passengers<1||passengers>6)return NextResponse.json({error:'Choose 1–6 passengers.'},{status:400});
    const pickup=String(input.pickup).trim().slice(0,300),dropoff=String(input.dropoff).trim().slice(0,300);
    if(pickup.length<5||dropoff.length<5||pickup.toLowerCase()===dropoff.toLowerCase())return NextResponse.json({error:'Enter two different full addresses.'},{status:400});
    const stops=Array.isArray(input.stops)?input.stops.map((stop:unknown)=>String(stop).trim()).filter(Boolean).slice(0,4):[];
    const metrics=await routeMetrics(pickup,dropoff,stops).catch(()=>null);
    const fare=metrics?priceTrip(metrics.distanceMiles,metrics.durationMinutes,!!input.airport,String(input.date),String(input.time)):null;
    const paymentMethod=input.paymentMethod==='cash'?'cash':'card';
    const row={passenger_id:account.user.id,name:account.profile.name,phone:account.profile.phone,email:account.user.email||'',pickup,dropoff,stops,ride_date:input.date,ride_time:input.time,passengers,airport:!!input.airport,notes:String(input.notes||'').trim().slice(0,1500),fare_estimate_cents:fare?.totalCents||0,fare_subtotal_cents:fare?.subtotalCents||null,surcharge_percent:fare?.surchargePercent||0,distance_miles:metrics?.distanceMiles??null,duration_minutes:metrics?.durationMinutes??null,pickup_lat:metrics?.pickupLat??null,pickup_lng:metrics?.pickupLng??null,ride_tier:fare?.rideTier||'unquoted',payment_method:paymentMethod,status:'New',fare_locked:false,payment_status:paymentMethod==='cash'?'cash_due':'unpaid',public_token:randomBytes(24).toString('hex')};
    const service=db(),{data,error}=await service.from('ride_requests').insert(row).select('id,fare_estimate_cents,distance_miles,ride_tier').single();
    if(error)throw error;
    if(fare)await dispatchRide(service,{...row,id:data.id}).catch(error=>console.error('Dispatch offer creation failed',error instanceof Error?error.message:error));
    return NextResponse.json({id:data.id,fareEstimateCents:data.fare_estimate_cents,distanceMiles:data.distance_miles,rideTier:data.ride_tier,quotePending:!fare},{status:201});
  }catch(error){
    console.error('Ride request failed',error instanceof Error?error.message:error);
    return NextResponse.json({error:'Unable to save your ride request. Please try again or contact A2B.'},{status:500});
  }
}

export async function PATCH(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
  if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const input=await req.json();
    if(typeof input.id!=='string')return NextResponse.json({error:'id required'},{status:400});
    const patch:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(input.status&&!['New','Contacted','Quoted','Scheduled','Assigned','En Route','Arrived','In Progress','Completed','Canceled'].includes(input.status))return NextResponse.json({error:'Invalid status'},{status:400});
    if(input.status)patch.status=input.status;
    if(typeof input.fareLocked==='boolean')patch.fare_locked=input.fareLocked;
    if(Number.isInteger(input.lockedFareCents)&&input.lockedFareCents>0&&input.lockedFareCents<=1_000_000)patch.locked_fare_cents=input.lockedFareCents;
    if(input.assignedDriverId===null||typeof input.assignedDriverId==='string'){patch.assigned_driver_id=input.assignedDriverId||null;if(input.assignedDriverId)patch.status='Assigned'}
    let query=db().from('ride_requests').update(patch).eq('id',input.id);
    if('locked_fare_cents'in patch)query=query.not('payment_status','in','(pending,paid)');
    const{data:updated,error}=await query.select('id').maybeSingle();
    if(error)throw error;
    if(!updated)return NextResponse.json({error:'locked_fare_cents'in patch?'Fare cannot change after card payment starts or completes.':'Ride request not found.'},{status:'locked_fare_cents'in patch?409:404});
    return NextResponse.json({ok:true});
  }catch(error){
    console.error('Ride update failed',error instanceof Error?error.message:error);
    return NextResponse.json({error:'Unable to update ride'},{status:500});
  }
}
