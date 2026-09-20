'use client';

import {useEffect,useState} from 'react';

const statuses=['New','Contacted','Quoted','Scheduled','Assigned','En Route','Arrived','In Progress','Completed','Canceled'];

export default function Admin(){
  const[pin,setPin]=useState(''),[data,setData]=useState<any>(null),[message,setMessage]=useState('');
  async function load(){const response=await fetch('/api/admin/data',{cache:'no-store'});if(response.ok)setData(await response.json());else if(response.status===401)setData(null)}
  useEffect(()=>{void load();const timer=setInterval(()=>void load(),30000);return()=>clearInterval(timer)},[]);
  async function login(){const response=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pin})});if(response.ok){setPin('');setMessage('Logged in');await load()}else setMessage('Invalid PIN')}
  async function logout(){await fetch('/api/admin/login',{method:'DELETE'});setData(null);setMessage('Signed out')}
  async function patchRide(id:string,body:Record<string,unknown>){const response=await fetch('/api/ride-requests',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,...body})});if(!response.ok)setMessage((await response.json()).error||'Update failed');else{setMessage('Ride updated');await load()}}
  async function patchApplication(id:string,status:string){const response=await fetch('/api/driver-applications',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,status})});if(!response.ok)setMessage('Application update failed');await load()}
  async function setTier(id:string,tier:string){const response=await fetch('/api/admin/drivers',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,tier})});if(!response.ok)setMessage('Driver update failed');await load()}

  if(!data)return <main className="shell" style={{padding:'70px 18px',maxWidth:500}}><h1>Admin Login</h1><input className="input" type="password" inputMode="numeric" autoComplete="current-password" placeholder="Admin PIN" value={pin} onChange={event=>setPin(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')void login()}}/><button className="btn btn-gold" style={{marginTop:12}} onClick={login}>Login</button>{message&&<p className="notice" role="status">{message}</p>}</main>;

  return <main className="shell" style={{padding:'40px 18px'}}>
    <div className="dashboard-head"><div><h1>Dispatch Dashboard</h1><p className="muted">Live driver availability, ranked offers, assignments, fare control, and payment status.</p></div><button className="btn btn-outline" onClick={logout}>Sign Out</button></div>
    {message&&<p className="notice" role="status">{message}</p>}
    <h2 className="gold">Ride Requests</h2>
    <div className="ride-list">{data.rides.map((ride:any)=><article className="panel admin-ride" key={ride.id}>
      <div className="trip-top"><div><span className="status-chip">{ride.ride_tier||'standard'} · {ride.status}</span><strong style={{display:'block',marginTop:8}}>{ride.name}</strong><div className="trip-actions"><a className="btn btn-outline" href={`tel:${ride.phone}`}>Call</a><a className="btn btn-outline" href={`sms:${ride.phone}`}>Text</a><a className="btn btn-outline" href={`mailto:${ride.email}`}>Email</a></div></div><div><strong>{ride.fare_estimate_cents||ride.locked_fare_cents?'$'+((ride.locked_fare_cents||ride.fare_estimate_cents)/100).toFixed(2):'Quote needed'}</strong><div>{ride.distance_miles==null?'Mileage pending':Number(ride.distance_miles).toFixed(1)+' miles'}</div><div className="gold">Payment: {String(ride.payment_status||'unpaid').replaceAll('_',' ')} · {ride.payment_method||'card'}</div></div></div>
      <div className="route-box"><div><small>PICKUP</small><strong>{ride.pickup}</strong></div><div><small>DROP-OFF</small><strong>{ride.dropoff}</strong></div></div>
      {ride.stops?.length>0&&<div className="muted">Stops: {ride.stops.join(' · ')}</div>}<div>{ride.ride_date} at {String(ride.ride_time).slice(0,5)} · {ride.surcharge_percent||0}% time upcharge</div>
      <label>Assigned driver<select className="input" value={ride.assigned_driver_id||''} onChange={event=>patchRide(ride.id,{assignedDriverId:event.target.value||null})}><option value="">Auto-offers / unassigned</option>{data.drivers.map((driver:any)=><option key={driver.id} value={driver.id}>{driver.name} · {driver.tier} · {driver.status}</option>)}</select></label>
      <div className="trip-actions">{statuses.map(status=><button className="btn btn-outline" key={status} onClick={()=>patchRide(ride.id,{status})}>{status}</button>)}<button className="btn btn-gold" onClick={()=>{const value=prompt('Final fare in dollars',((ride.locked_fare_cents||ride.fare_estimate_cents||0)/100).toFixed(2));const cents=Math.round(Number(value)*100);if(Number.isInteger(cents)&&cents>0)void patchRide(ride.id,{lockedFareCents:cents,fareLocked:true,status:'Quoted'});else if(value!==null)setMessage('Enter a valid fare greater than $0.')}}>Lock Final Fare</button></div>
    </article>)}</div>
    <h2 className="gold" style={{marginTop:36}}>Active Drivers</h2>
    {!data.drivers.length?<p className="muted">Approved drivers appear here after they create their account.</p>:<div className="grid3">{data.drivers.map((driver:any)=><article className="panel driver-admin-card" key={driver.id}><strong>{driver.name}</strong><div className="gold">{driver.status}</div><div className="muted">{driver.vehicle}</div><label>Driver tier<select className="input" value={driver.tier||'standard'} onChange={event=>setTier(driver.id,event.target.value)}><option value="top">Top</option><option value="standard">Standard</option><option value="developing">Developing</option></select></label><div className="muted">Location: {driver.location_sharing&&driver.last_location_at?`Live · ${new Date(driver.last_location_at).toLocaleTimeString()}`:'Not sharing'}</div>{driver.latitude&&driver.longitude&&<a className="gold" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${driver.latitude},${driver.longitude}`}>Open driver location</a>}</article>)}</div>}
    <h2 className="gold" style={{marginTop:36}}>Driver Applications</h2>
    <div className="ride-list">{data.applications.map((application:any)=><article className="panel" style={{padding:16}} key={application.id}><strong>{application.name}</strong> · <a href={`tel:${application.phone}`}>{application.phone}</a> · <a href={`mailto:${application.email}`}>{application.email}</a><div className="muted">{application.vehicle} · {application.insurance}</div><div>Status: {application.status}</div><button className="btn btn-gold" style={{marginRight:8,marginTop:8}} onClick={()=>patchApplication(application.id,'Approved')}>Approve</button><button className="btn btn-outline" style={{marginTop:8}} onClick={()=>patchApplication(application.id,'Rejected')}>Reject</button></article>)}</div>
  </main>;
}
