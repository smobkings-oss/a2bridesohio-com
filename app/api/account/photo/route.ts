import {NextResponse} from 'next/server';
import {currentAccount} from '../../../../lib/account';
import {db} from '../../../../lib/db';
import sharp from 'sharp';

const bucket='account-photos';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'};
export async function GET(req:Request){
  const account=await currentAccount();if(!account)return new Response(null,{status:401,headers});
  let userId=account.user.id;
  const rideId=new URL(req.url).searchParams.get('ride');
  if(rideId){
    const service=db();const {data:ride}=await service.from('ride_requests').select('passenger_id,assigned_driver_id,status').eq('id',rideId).in('status',['Assigned','En Route','Arrived','In Progress']).maybeSingle();
    if(!ride?.assigned_driver_id)return new Response(null,{status:404,headers});
    const {data:driver}=await service.from('drivers').select('user_id').eq('id',ride.assigned_driver_id).maybeSingle();
    if(!driver)return new Response(null,{status:404,headers});
    if(ride.passenger_id===account.user.id)userId=driver.user_id;
    else if(driver.user_id===account.user.id)userId=ride.passenger_id;
    else return new Response(null,{status:403,headers});
  }
  const {data,error}=await db().storage.from(bucket).download(`${userId}/photo`);
  if(error||!data)return new Response(null,{status:404,headers});
  return new Response(await data.arrayBuffer(),{headers:{...headers,'Content-Type':data.type||'image/jpeg'}});
}
export async function POST(req:Request){
  const account=await currentAccount();if(!account)return NextResponse.json({error:'Sign in first.'},{status:401});
  if(Number(req.headers.get('content-length')||0)>4000000)return NextResponse.json({error:'Choose a photo under 3 MB.'},{status:413});
  const form=await req.formData(),photo=form.get('photo');
  if(!(photo instanceof File)||photo.size>3000000||photo.size<12)return NextResponse.json({error:'Choose a JPG, PNG or WebP photo under 3 MB.'},{status:400});
  const bytes=new Uint8Array(await photo.arrayBuffer());
  const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71;
  const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!png&&!jpg&&!webp)return NextResponse.json({error:'Use a JPG, PNG or WebP photo.'},{status:400});
  let cleanPhoto:Buffer;
  try{cleanPhoto=await sharp(bytes,{limitInputPixels:24000000}).rotate().resize(512,512,{fit:'cover'}).jpeg({quality:85}).toBuffer()}catch{return NextResponse.json({error:'Could not read this photo. Choose a different image.'},{status:400})}
  const service=db();
  await service.storage.createBucket(bucket,{public:false,fileSizeLimit:3000000,allowedMimeTypes:['image/jpeg','image/png','image/webp']});
  const {error}=await service.storage.from(bucket).upload(`${account.user.id}/photo`,cleanPhoto,{upsert:true,contentType:'image/jpeg'});
  if(error)return NextResponse.json({error:'Photo could not be saved. Please try again.'},{status:503});
  return NextResponse.json({ok:true},{headers});
}
