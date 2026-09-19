import {NextResponse} from 'next/server';
import {db} from '../../../lib/db';

export async function GET(){
  try{
    const{error}=await db().from('ride_requests').select('id',{head:true,count:'exact'});
    if(error)throw error;
    return NextResponse.json({ok:true,database:'connected',maps:!!process.env.GOOGLE_MAPS_API_KEY,payments:!!process.env.STRIPE_SECRET_KEY});
  }catch{
    return NextResponse.json({ok:false,database:'unavailable',maps:!!process.env.GOOGLE_MAPS_API_KEY,payments:!!process.env.STRIPE_SECRET_KEY},{status:503});
  }
}
