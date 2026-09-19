import{NextResponse}from'next/server';
import{currentAccount}from'../../../../lib/account';
import{db}from'../../../../lib/db';
export async function GET(){const a=await currentAccount();if(!a||a.profile.role!=='passenger')return NextResponse.json({error:'Unauthorized'},{status:401});const{data,error}=await db().from('ride_requests').select('id,created_at,pickup,dropoff,ride_date,ride_time,status,payment_status,fare_estimate_cents,locked_fare_cents,fare_locked,public_token').eq('passenger_id',a.user.id).order('created_at',{ascending:false});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({rides:data||[]})}
