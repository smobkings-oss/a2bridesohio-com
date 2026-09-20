'use client';
import Link from 'next/link';
import {FormEvent,useEffect,useState} from 'react';

export default function Book(){
  const [account,setAccount]=useState<any>(),[fare,setFare]=useState<any>(null),[message,setMessage]=useState(''),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[saved,setSaved]=useState<any>(null);
  const [trip,setTrip]=useState({pickup:'',dropoff:'',stops:[] as string[],date:'',time:'',passengers:'1',airport:false,notes:''});
  useEffect(()=>{localStorage.removeItem('a2b_booking');fetch('/api/account').then(r=>{if(!r.ok)throw Error();return r.json()}).then(j=>setAccount(j.account)).catch(()=>{setAccount(null);setMessage('Could not load your account. Please sign in again.')})},[]);
  useEffect(()=>{
    setFare(null); if(!trip.pickup.trim()||!trip.dropoff.trim()||!trip.date||!trip.time)return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{setLoading(true);try{
      const r=await fetch('/api/fare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(trip),signal:controller.signal});
      if(!r.ok)throw Error(); const quote=await r.json();if(!controller.signal.aborted)setFare(quote);
    }catch{if(!controller.signal.aborted)setFare(null)}finally{if(!controller.signal.aborted)setLoading(false)}},700);
    return()=>{clearTimeout(timer);controller.abort();setLoading(false)};
  },[trip.pickup,trip.dropoff,trip.stops.join('|'),trip.date,trip.time,trip.airport]);
  const update=(key:string,value:any)=>{setSaved(null);setTrip(t=>({...t,[key]:value}))};
  async function requestRide(e:FormEvent){
    e.preventDefault();if(saved||busy)return;setBusy(true);setMessage('');
    try{const r=await fetch('/api/ride-requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...trip,paymentMethod:'cash'})});const j=await r.json();if(!r.ok)throw Error(j.error||'Unable to save your request.');setSaved(j);setMessage('Request saved. Text or email A2B below to confirm availability and price. Your ride is not confirmed yet.');}
    catch(error){setMessage(error instanceof Error?error.message:'Unable to save your request. Try again.')}finally{setBusy(false)}
  }
  const summary=saved&&account?[
    'A2B RIDE REQUEST',`Ride number: ${saved.id}`,`Name: ${account.name}`,`Phone: ${account.phone}`,`Email: ${account.email}`,
    `Pickup date/time (Eastern): ${trip.date} ${trip.time}`,`Pickup: ${trip.pickup}`,...trip.stops.filter(Boolean).map((s,i)=>`Stop ${i+1}: ${s}`),`Destination: ${trip.dropoff}`,
    `Passengers: ${trip.passengers}`,`Miles: ${saved.distanceMiles==null?'Awaiting route confirmation':Number(saved.distanceMiles).toFixed(1)}`,
    `Estimate: ${saved.quotePending?'Quote requested':'$'+(saved.fareEstimateCents/100).toFixed(2)}`,'Payment: cash / arrange with A2B',`Notes: ${trip.notes}`
  ].join('\n'):'';
  if(account===undefined)return <main className="shell section">Loading your account…</main>;
  if(!account||account.role!=='passenger')return <main className="shell section"><div className="panel account-required"><h1>YOUR RIDE STARTS HERE</h1><p>Create a passenger account or sign in to request a ride.</p><Link href="/account" className="btn btn-gold">Sign In or Create Account</Link>{message&&<p role="alert">{message}</p>}</div></main>;
  return <main className="shell section"><div style={{maxWidth:780,margin:'auto'}}>
    <div className="eyebrow">A2B RIDES</div><h1>REQUEST YOUR RIDE</h1>
    <p className="notice">Cash requests are available. A2B confirms availability and the price with you before you commit. Online card payment is not available yet.</p>
    <div className="panel contact-strip"><strong>{account.name}</strong><span>{account.phone}</span><span>{account.email}</span></div>
    <form className="panel booking-card" style={{marginTop:18}} onSubmit={requestRide}>
      <label>Pickup address<input required className="input" maxLength={300} value={trip.pickup} onChange={e=>update('pickup',e.target.value)}/></label>
      {trip.stops.map((stop,i)=><div key={i} className="stop-row"><label>Stop {i+1}<input required className="input" maxLength={300} value={stop} onChange={e=>update('stops',trip.stops.map((s,n)=>n===i?e.target.value:s))}/></label><button type="button" className="btn btn-outline" onClick={()=>update('stops',trip.stops.filter((_,n)=>n!==i))}>Remove</button></div>)}
      <button type="button" className="text-button" disabled={trip.stops.length>=4} onClick={()=>update('stops',[...trip.stops,''])}>+ Add a stop</button>
      <label>Destination<input required className="input" maxLength={300} value={trip.dropoff} onChange={e=>update('dropoff',e.target.value)}/></label>
      <div className="grid2"><label>Pickup date<input required type="date" className="input" value={trip.date} onChange={e=>update('date',e.target.value)}/></label><label>Pickup time (Eastern)<input required type="time" className="input" value={trip.time} onChange={e=>update('time',e.target.value)}/></label></div>
      <div className="grid2"><label>Passengers<select className="input" value={trip.passengers} onChange={e=>update('passengers',e.target.value)}>{[1,2,3,4,5,6].map(n=><option value={n} key={n}>{n}</option>)}</select></label><label className="panel check-card"><input type="checkbox" checked={trip.airport} onChange={e=>update('airport',e.target.checked)}/> Airport ride</label></div>
      <label>Stops, luggage, child seats or other needs<textarea className="input" maxLength={1500} value={trip.notes} onChange={e=>update('notes',e.target.value)}/></label>
      <div className="fare-card">{loading?<span>Checking route… You can submit while we check.</span>:fare?<><strong>${fare.total.toFixed(2)}</strong><div>{fare.distanceMiles.toFixed(1)} miles · {Math.round(fare.durationMinutes)} minutes<br/>{fare.surchargePercent}% scheduled upcharge</div></>:<span>Price and mileage to be confirmed by A2B. You can still submit your request.</span>}</div>
      <button className="btn btn-gold" disabled={busy||!!saved}>{busy?'Saving request…':saved?'Request saved':'Request Ride · Pay Cash'}</button>
      {message&&<p className="notice" role="status">{message}</p>}
      {saved&&<section><strong>Ride number: {saved.id}</strong><p>Choose a contact option to send your saved trip details. Texting opens your Messages app; tap Send there.</p><div className="trip-actions"><a className="btn btn-gold" href={`sms:14194555181?&body=${encodeURIComponent(summary)}`}>Text A2B This Request</a><a className="btn btn-outline" href={`mailto:a2brides@a2bridesohio.com?subject=${encodeURIComponent('A2B ride request '+saved.id)}&body=${encodeURIComponent(summary)}`}>Email This Request</a></div></section>}
    </form><p><Link className="gold" href="/passenger">View your ride requests</Link></p>
  </div></main>;
}
