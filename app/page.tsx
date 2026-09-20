import Link from 'next/link';

const services=[
  ['LOCAL RIDES','Direct transportation across Toledo, Fremont and surrounding Northwest Ohio communities.'],
  ['AIRPORT','Pre-arranged service to DTW, CLE, CMH, TOL and other regional airports.'],
  ['MEDICAL','One-way or round-trip transportation for appointments, procedures and treatment.'],
  ['LONG DISTANCE','Comfortable one-way, round-trip and multi-day travel across Ohio, Michigan and beyond.'],
  ['EVENT & VIP','Concerts, casinos, business travel, nights out and private event transportation.'],
  ['DIRECT SUPPORT','Call or text A2B directly when plans change or you need help with a booking.'],
];

export default function Home(){return <main>
  <section className="hero"><div className="shell" style={{textAlign:'center',paddingBlock:72}}>
    <div className="eyebrow">PROFESSIONAL RIDES ACROSS OHIO &amp; MICHIGAN</div>
    <h1 style={{fontSize:'clamp(3.4rem,10vw,7.5rem)',margin:'18px 0 20px'}}>ANYTIME.<br/><span className="gold">ANYWHERE.</span></h1>
    <p className="muted" style={{fontSize:20,maxWidth:720,margin:'0 auto 30px'}}>Local, airport, medical, event and long-distance transportation with direct support from A2B.</p>
    <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}><Link className="btn btn-gold" href="/book">Get Fare &amp; Request Ride</Link><a className="btn btn-outline" href="sms:14194555181">Text 419-455-5181</a></div>
    <p className="muted" style={{marginTop:18,fontSize:14}}>Available 24/7 by reservation • Final fare confirmed before payment</p>
  </div></section>
  <section id="services" className="shell section"><div className="eyebrow">SERVICES</div><h2 style={{fontSize:'clamp(2.2rem,6vw,3.8rem)',margin:'10px 0 28px'}}>ONE NUMBER FOR THE WHOLE TRIP.</h2><div className="grid3">{services.map(([title,description])=><article className="panel service-card" key={title}><h3 className="gold">{title}</h3><p className="muted">{description}</p></article>)}</div></section>
  <section style={{background:'#0b0b0b',paddingBlock:72}}><div className="shell grid2">
    <div><div className="eyebrow">HOW IT WORKS</div><h2 style={{fontSize:42}}>CLEAR PRICE. DIRECT CONTACT. SECURE PAYMENT.</h2><p className="muted">Enter your route, receive an estimate, and submit the request. Dispatch reviews the trip and locks the final fare. You pay securely only after that confirmation.</p></div>
    <div className="panel" style={{padding:26}}><ol style={{margin:0,paddingLeft:22}}><li style={{marginBottom:14}}>Enter your pickup, destination and trip time.</li><li style={{marginBottom:14}}>Submit the request for dispatch review.</li><li>Pay securely after your final fare is locked.</li></ol><Link className="btn btn-gold" style={{marginTop:22}} href="/book">Start Booking</Link></div>
  </div></section>
</main>}
