'use client';
import {FormEvent,useState} from 'react';

const initial={name:'',phone:'',email:'',address:'',vehicle:'',license:'',availability:'',experience:'',insurance:''};

export default function Drivers(){
  const[f,setF]=useState(initial),[msg,setMsg]=useState(''),[busy,setBusy]=useState(false),[consent,setConsent]=useState(false);
  const set=(key:string,value:string)=>setF({...f,[key]:value});
  async function send(e:FormEvent){
    e.preventDefault();setMsg('');
    if(!consent)return setMsg('Please confirm that A2B may contact you about this application.');
    setBusy(true);
    try{const r=await fetch('/api/driver-applications',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(f)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Unable to submit.');setMsg('Application received. A2B will contact you after review.');setF(initial);setConsent(false)}catch(error){setMsg(error instanceof Error?error.message:'Unable to submit.')}finally{setBusy(false)}
  }
  return <main className="shell section"><div style={{maxWidth:820,margin:'auto'}}>
    <div className="eyebrow">DRIVER OPPORTUNITIES</div><h1 style={{fontSize:'clamp(2.6rem,7vw,4.5rem)',marginBottom:12}}>DRIVE WITH A2B</h1>
    <p className="muted">Already driving Uber or Lyft? Tell us about your vehicle and availability. Approval may require license, insurance, vehicle and background verification.</p>
    <form className="panel" style={{padding:22,marginTop:26}} onSubmit={send}>
      <div className="grid2">
        <label>Full name<input required className="input" value={f.name} onChange={e=>set('name',e.target.value)} /></label>
        <label>Phone<input required className="input" inputMode="tel" value={f.phone} onChange={e=>set('phone',e.target.value)} /></label>
        <label>Email<input required className="input" type="email" value={f.email} onChange={e=>set('email',e.target.value)} /></label>
        <label>City and state<input className="input" value={f.address} onChange={e=>set('address',e.target.value)} /></label>
        <label>Vehicle year, make and model<input required className="input" value={f.vehicle} onChange={e=>set('vehicle',e.target.value)} /></label>
        <label>Driver license state / status<input required className="input" value={f.license} onChange={e=>set('license',e.target.value)} /></label>
        <label>Insurance carrier / expiration<input required className="input" value={f.insurance} onChange={e=>set('insurance',e.target.value)} /></label>
        <label>Days and hours available<input className="input" value={f.availability} onChange={e=>set('availability',e.target.value)} /></label>
      </div>
      <label style={{display:'block',marginTop:16}}>Rideshare or professional driving experience<textarea className="input" rows={4} value={f.experience} onChange={e=>set('experience',e.target.value)} /></label>
      <label style={{display:'flex',gap:10,alignItems:'flex-start',marginTop:16}}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} style={{marginTop:6}}/><span>I certify this information is accurate and agree that A2B may call, text or email me about this application.</span></label>
      <button className="btn btn-gold" style={{marginTop:20}} disabled={busy}>{busy?'Submitting…':'Submit Application'}</button>
      {msg&&<p className="notice" role="status" style={{marginBottom:0}}>{msg}</p>}
    </form>
  </div></main>
}
