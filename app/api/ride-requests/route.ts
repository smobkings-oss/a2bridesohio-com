import{NextResponse}from'next/server';
import{randomBytes}from'crypto';
import{db}from'../../../lib/db';
import{isAdmin}from'../../../lib/auth';
import{currentAccount}from'../../../lib/account';
import{routeMetrics}from'../../../lib/routes';
import{priceTrip}from'../../../lib/pricing';

export async function POST(req:Request){
  try{
    const account=await currentAccount();
    if(!account||account.profile.role!=='passenger')return NextResponse.json({error:'Create or sign in to your passenger account before booking.'},{status:401});
    const x=await req.json();
    for(const k of['pickup','dropoff','date','time'])if(!x[k])return NextResponse.json({error:`${k} is required`},{status:400});
    const m=await routeMetrics(String(x.pickup),String(x.dropoff));
    const fare=priceTrip(m.distanceMiles,m.durationMinutes,!!x.airport),publicToken=randomBytes(24).toString('hex');
    const row={passenger_id:account.user.id,name:account.profile.name,phone:account.profile.phone,pickup:String(x.pickup).slice(0,300),dropoff:String(x.dropoff).slice(0,300),ride_date:x.date,ride_time:x.time,passengers:Math.max(1,Math.min(6,Number(x.passengers||1))),airport:!!x.airport,notes:String(x.notes||'').slice(0,1500),fare_estimate_cents:fare,distance_miles:m.distanceMiles,duration_minutes:m.durationMinutes,status:'New',fare_locked:false,payment_status:'unpaid',public_token:publicToken};
    const{data,error}=await db().from('ride_requests').insert(row).select('id,public_token,fare_estimate_cents').single();
    if(error)throw error;
    return NextResponse.json({id:data.id,publicToken:data.public_token,fareEstimateCents:data.fare_estimate_cents},{status:201});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save request'},{status:500})}
}

export async function PATCH(req:Request){
  if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
  try{
    const x=await req.json();if(!x.id)return NextResponse.json({error:'id required'},{status:400});
    const patch:any={updated_at:new Date().toISOString()};
    if(x.status)patch.status=x.status;
    if(typeof x.fareLocked==='boolean')patch.fare_locked=x.fareLocked;
    if(Number.isInteger(x.lockedFareCents)&&x.lockedFareCents>0)patch.locked_fare_cents=x.lockedFareCents;
    if(x.assignedDriverId===null||typeof x.assignedDriverId==='string'){patch.assigned_driver_id=x.assignedDriverId||null;if(x.assignedDriverId)patch.status='Assigned'}
    const{error}=await db().from('ride_requests').update(patch).eq('id',x.id);if(error)throw error;
    return NextResponse.json({ok:true});
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to update ride'},{status:500})}
}
