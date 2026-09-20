'use client';

import Link from 'next/link';
import {FormEvent,useEffect,useState} from 'react';

type PaymentMethod='card'|'cash';

export default function Book(){
  const[account,setAccount]=useState<any>();
  const[fare,setFare]=useState<any>(null);
  const[message,setMessage]=useState('');
  const[loading,setLoading]=useState(false);
  const[busy,setBusy]=useState(false);
  const[saved,setSaved]=useState<any>(null);
  const[paymentMethod,setPaymentMethod]=useState<PaymentMethod>('card');
  const[trip,setTrip]=useState({pickup:'',dropoff:'',stops:[] as string[],date:'',time:'',passengers:'1',airport:false,notes:''});

  useEffect(()=>{fetch('/api/account',{cache:'no-store'}).then(r=>r.json()).then(j=>setAccount(j.account)).catch(()=>{setAccount(null);setMessage('Could not load your account. Please sign in again.')})},[]);
  useEffect(()=>{
    setFare(null);
    if(!trip.pickup.trim()||!trip.dropoff.trim()||!trip.date||!trip.time)return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{setLoading(true);try{
      const response=await fetch('/api/fare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(trip),signal:controller.signal});
      const quote=await response.json();
      if(!response.ok)throw new Error(quote.error||'Unable to calculate fare.');
      if(!controller.signal.aborted){setFare(quote);setMessage('')}
    }catch(error){if(!controller.signal.aborted){setFare(null);setMessage(error instanceof Error?error.message:'Unable to calculate fare.')}}finally{if(!controller.signal.aborted)setLoading(false)}},700);
    return()=>{clearTimeout(timer);controller.abort()};
  },[trip.pickup,trip.dropoff,trip.stops.join('|'),trip.date,trip.time,trip.airport]);

  const update=(key:string,value:any)=>{setSaved(null);setTrip(current=>({...current,[key]:value}))};
  async function requestRide(event:FormEvent){
    event.preventDefault();if(saved||busy)return;setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/ride-requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...trip,paymentMethod})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Unable to save your request.');
      setSaved(result);
      setMessage(paymentMethod==='card'?'Request saved. Dispatch will confirm availability and lock the final fare; then Pay Now will appear in your passenger dashboard.':'Cash request saved. Dispatch will confirm availability and your final fare.');
    }catch(error){setMessage(error instanceof Error?error.message:'Unable to save your request. Try again.')}finally{setBusy(false)}
  }

  const summary=saved&&account?[
    'A2B RIDE REQUEST',`Ride number: ${saved.id}`,`Name: ${account.name}`,`Phone: ${account.phone}`,`Email: ${account.email}`,
    `Pickup date/time (Eastern): ${trip.date} ${trip.time}`,`Pickup: ${trip.pickup}`,...trip.stops.filter(Boolean).map((stop,index)=>`Stop ${index+1}: ${stop}`),`Destination: ${trip.dropoff}`,
    `Passengers: ${trip.passengers}`,`Miles: ${saved.distanceMiles==null?'Awaiting route confirmation':Number(saved.distanceMiles).toFixed(1)}`,
    `Estimate: ${saved.quotePending?'Quote requested':'$'+(saved.fareEstimateCents/100).toFixed(2)}`,`Payment: ${paymentMethod==='card'?'secure online card payment after final fare':'cash'}`,`Notes: ${trip.notes}`
  ].join('\n'):'';

  if(account===undefined)return <main className="shell section">Loading your account…</main>;
  if(!account||account.role!=='passenger')return <main className="shell section"><div className="panel account-required"><h1>YOUR RIDE STARTS HERE</h1><p>Create a passenger account or sign in to request a ride.</p><Link href="/account" className="btn btn-gold">Sign In or Create Account</Link>{message&&<p role="alert">{message}</p>}</div></main>;
  return <main className="shell section"><div style={{maxWidth:780,margin:'auto'}}>
    <div className="eyebrow">A2B RIDES</div><h1>REQUEST YOUR RIDE</h1>
    <p className="notice">See your route estimate before requesting. A2B confirms availability and locks the final fare before any online card payment.</p>
    <div className="panel contact-strip"><strong>{account.name}</strong><span>{account.phone}</span><span>{account.email}</span></div>
    <form className="panel booking-card" style={{marginTop:18}} onSubmit={requestRide}>
      <label>Pickup address<input required autoComplete="street-address" className="input" maxLength={300} value={trip.pickup} onChange={event=>update('pickup',event.target.value)}/></label>
      {trip.stops.map((stop,index)=><div key={index} className="stop-row"><label>Stop {index+1}<input required className="input" maxLength={300} value={stop} onChange={event=>update('stops',trip.stops.map((value,number)=>number===index?event.target.value:value))}/></label><button type="button" className="btn btn-outline" onClick={()=>update('stops',trip.stops.filter((_,number)=>number!==index))}>Remove</button></div>)}
      <button type="button" className="text-button" disabled={trip.stops.length>=4} onClick={()=>update('stops',[...trip.stops,''])}>+ Add a stop</button>
      <label>Destination<input required autoComplete="street-address" className="input" maxLength={300} value={trip.dropoff} onChange={event=>update('dropoff',event.target.value)}/></label>
      <div className="grid2"><label>Pickup date<input required type="date" className="input" value={trip.date} onChange={event=>update('date',event.target.value)}/></label><label>Pickup time (Eastern)<input required type="time" className="input" value={trip.time} onChange={event=>update('time',event.target.value)}/></label></div>
      <div className="grid2"><label>Passengers<select className="input" value={trip.passengers} onChange={event=>update('passengers',event.target.value)}>{[1,2,3,4,5,6].map(number=><option value={number} key={number}>{number}</option>)}</select></label><label className="panel check-card"><input type="checkbox" checked={trip.airport} onChange={event=>update('airport',event.target.checked)}/> Airport ride</label></div>
      <label>Stops, luggage, child seats or other needs<textarea className="input" maxLength={1500} value={trip.notes} onChange={event=>update('notes',event.target.value)}/></label>
      <div className="fare-card">{loading?<span>Checking route and mileage…</span>:fare?<><strong>${fare.total.toFixed(2)}</strong><div>{fare.distanceMiles.toFixed(1)} miles · {Math.round(fare.durationMinutes)} minutes<br/>{fare.surchargePercent?`${fare.surchargePercent}% ${fare.label} upcharge`:'Standard scheduled rate'}</div></>:<span>Enter the full route to calculate mileage and an estimate. You may still submit if route pricing is temporarily unavailable.</span>}</div>
      <fieldset className="payment-choice"><legend>How would you like to pay?</legend><label><input type="radio" name="payment" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')}/> Card online after final fare</label><label><input type="radio" name="payment" checked={paymentMethod==='cash'} onChange={()=>setPaymentMethod('cash')}/> Cash</label></fieldset>
      <button className="btn btn-gold" disabled={busy||!!saved}>{busy?'Saving request…':saved?'Request saved':`Request Ride · ${paymentMethod==='card'?'Pay Online Later':'Pay Cash'}`}</button>
      {message&&<p className="notice" role="status">{message}</p>}
      {saved&&<section><strong>Ride number: {saved.id}</strong><p>Your request is saved. Use your passenger dashboard for status and secure payment, or contact A2B with these details.</p><div className="trip-actions"><Link className="btn btn-gold" href="/passenger">Open Passenger Dashboard</Link><a className="btn btn-outline" href={`sms:14194555181?&body=${encodeURIComponent(summary)}`}>Text A2B</a><a className="btn btn-outline" href={`mailto:a2brides@a2bridesohio.com?subject=${encodeURIComponent('A2B ride request '+saved.id)}&body=${encodeURIComponent(summary)}`}>Email A2B</a></div></section>}
    </form>
  </div></main>;
}
