'use client';

import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import ProfilePhoto from '../components/ProfilePhoto';

export default function Passenger(){
  const router=useRouter();
  const[account,setAccount]=useState<any>();
  const[rides,setRides]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[message,setMessage]=useState('');
  const[paying,setPaying]=useState<string|null>(null);

  async function load(){
    const[accountResponse,ridesResponse]=await Promise.all([fetch('/api/account',{cache:'no-store'}),fetch('/api/passenger/rides',{cache:'no-store'})]);
    const accountResult=await accountResponse.json();
    if(!accountResult.account||accountResult.account.role!=='passenger'){router.push('/account');return}
    setAccount(accountResult.account);
    if(ridesResponse.ok)setRides((await ridesResponse.json()).rides);
    setLoading(false);
  }
  useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{const status=new URLSearchParams(window.location.search).get('payment');if(status==='success')setMessage('Payment received. Stripe confirmation may take a few seconds to appear.');if(status==='canceled')setMessage('Payment was canceled. Your ride request is still saved.')},[]);

  async function pay(rideId:string){
    setPaying(rideId);setMessage('Opening secure Stripe checkout…');
    try{const response=await fetch('/api/payments/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rideRequestId:rideId})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to start payment.');if(!result.url)throw new Error('Secure checkout is unavailable.');window.location.assign(result.url)}catch(error){setMessage(error instanceof Error?error.message:'Unable to start payment.');setPaying(null)}
  }
  async function logout(){await fetch('/api/account',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'logout'})});router.push('/account');router.refresh()}

  if(loading)return <main className="shell section"><p>Loading your rides…</p></main>;
  return <main className="shell section">
    <div className="dashboard-head"><div><div className="eyebrow">PASSENGER ACCOUNT</div><h1>WELCOME, {account.name.toUpperCase()}</h1></div><button className="btn btn-outline" onClick={logout}>Sign Out</button></div>
    <ProfilePhoto/><Link className="btn btn-gold" href="/book">Book a New Ride</Link>
    {message&&<p className="notice" role="status">{message}</p>}
    <h2 style={{marginTop:36}}>Your rides</h2>
    {!rides.length?<div className="panel empty-state"><h3>No rides yet</h3><p className="muted">Your requested rides will appear here.</p></div>:<div className="ride-list">{rides.map(ride=>ride.archived?<article className="panel ride-card" key={ride.id}>Ride number: {ride.id}</article>:<article className="panel ride-card" key={ride.id}>
      <div><strong>{ride.pickup}</strong>{ride.driver&&<div><img src={`/api/account/photo?ride=${ride.id}`} alt="Driver profile" width={72} height={72} style={{objectFit:'cover',borderRadius:36}} onError={event=>{event.currentTarget.style.display='none'}}/><p>Driver: {ride.driver.name} · {ride.driver.vehicle}</p></div>}<div className="gold">to {ride.dropoff}</div><p className="muted">{ride.ride_date} at {String(ride.ride_time).slice(0,5)}</p></div>
      <div><span className="status-chip">{ride.status}</span><p>{ride.payment_status==='paid'?'Paid':ride.payment_status==='refunded'?'Refunded':ride.payment_status==='pending'?'Payment started':ride.fare_locked?`Final fare: $${(ride.locked_fare_cents/100).toFixed(2)}`:'Fare pending'}</p>{ride.fare_locked&&!['paid','refunded'].includes(ride.payment_status)&&<button className="btn btn-gold" disabled={paying===ride.id} onClick={()=>pay(ride.id)}>{paying===ride.id?'Opening…':'Pay Now'}</button>}{ride.payment_status==='paid'&&<a className="btn btn-outline" href={`/api/payments/receipt?ride=${encodeURIComponent(ride.id)}`} target="_blank" rel="noreferrer">View Stripe Receipt</a>}</div>
    </article>)}</div>}
  </main>;
}
