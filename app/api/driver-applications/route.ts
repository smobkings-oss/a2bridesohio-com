import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';
import {isAdmin} from '../../../lib/auth';

const text=(value:unknown,max:number)=>String(value||'').trim().slice(0,max);

export async function POST(req:Request){
  try{
    const x=await req.json();
    const row={name:text(x.name,120),phone:text(x.phone,40),email:text(x.email,180).toLowerCase(),address:text(x.address,250),vehicle:text(x.vehicle,180),license:text(x.license,120),availability:text(x.availability,500),experience:text(x.experience,1500),insurance:text(x.insurance,180),status:'Pending'};
    for(const key of ['name','phone','email','vehicle','license','insurance'] as const)if(!row[key])return NextResponse.json({error:`${key} is required`},{status:400});
    if(!/^\S+@\S+\.\S+$/.test(row.email))return NextResponse.json({error:'Enter a valid email address.'},{status:400});
    const{error}=await db().from('driver_applications').insert(row);if(error)throw error;
    return NextResponse.json({ok:true},{status:201});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to submit application.'},{status:500})}
}

export async function PATCH(req:Request){
  if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
  try{const x=await req.json();if(!x.id||!['Approved','Rejected','Pending'].includes(x.status))return NextResponse.json({error:'Invalid update'},{status:400});const{error}=await db().from('driver_applications').update({status:x.status,updated_at:new Date().toISOString()}).eq('id',x.id);if(error)throw error;return NextResponse.json({ok:true})}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Unable to update application.'},{status:500})}
}
