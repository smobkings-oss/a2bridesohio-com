import {NextResponse} from 'next/server';
import {isAdmin} from '../../../../lib/auth';
import {db} from '../../../../lib/db';
import {sameOrigin} from '../../../../lib/http';

export async function PATCH(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Forbidden'},{status:403});
  if(!await isAdmin())return NextResponse.json({error:'Unauthorized'},{status:401});
  const input=await req.json();
  if(!input.id||!['top','standard','developing'].includes(input.tier))return NextResponse.json({error:'Invalid tier'},{status:400});
  const{error}=await db().from('drivers').update({tier:input.tier,updated_at:new Date().toISOString()}).eq('id',input.id);
  if(error)return NextResponse.json({error:'Unable to update driver'},{status:500});
  return NextResponse.json({ok:true});
}
