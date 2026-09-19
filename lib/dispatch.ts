import type{SupabaseClient}from'@supabase/supabase-js';
function miles(a:number,b:number,c:number,d:number){const r=3958.8,p=(x:number)=>x*Math.PI/180,v=Math.sin(p(c-a)/2)**2+Math.cos(p(a))*Math.cos(p(c))*Math.sin(p(d-b)/2)**2;return 2*r*Math.asin(Math.sqrt(v))}
export async function dispatchRide(db:SupabaseClient,ride:any){
  const{data:drivers}=await db.from('drivers').select('id,tier,status,latitude,longitude,last_location_at,last_offer_at').eq('status','Available');
  if(!drivers?.length)return;
  const slowBefore=Date.now()-30*60*1000,normal=drivers.filter(d=>d.tier!=='top'),top=drivers.filter(d=>d.tier==='top'),topSlow=top.filter(d=>!d.last_offer_at||new Date(d.last_offer_at).getTime()<slowBefore);
  let pool=ride.ride_tier==='premium'?[...top,...normal]:[...normal,...topSlow];
  if(!pool.length)pool=drivers;
  const ranked=pool.map(d=>({...d,distance:ride.pickup_lat&&ride.pickup_lng&&d.latitude&&d.longitude?miles(Number(d.latitude),Number(d.longitude),Number(ride.pickup_lat),Number(ride.pickup_lng)):999,tierRank:ride.ride_tier==='premium'?(d.tier==='top'?0:d.tier==='standard'?1:2):(d.tier==='developing'?0:d.tier==='standard'?1:2)})).sort((a,b)=>a.tierRank-b.tierRank||a.distance-b.distance).slice(0,5);
  const now=new Date().toISOString();
  await db.from('ride_offers').insert(ranked.map((d,i)=>({ride_request_id:ride.id,driver_id:d.id,priority:i+1,status:'Offered'})));
  await db.from('drivers').update({last_offer_at:now}).in('id',ranked.map(d=>d.id));
}
