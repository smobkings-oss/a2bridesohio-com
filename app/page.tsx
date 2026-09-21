import Link from 'next/link';

const services = [
  ['HOP NOW', 'Request an instant pickup. Nearby A2B drivers get the trip and you track it from the rider app.'],
  ['SCHEDULED RIDES', 'Lock a date and time for work, medical visits, nights out and airport runs.'],
  ['AIRPORT', 'Pre-arranged and last-minute service to DTW, CLE, CMH, TOL and other regional airports.'],
  ['MEDICAL', 'One-way or round-trip transportation for appointments, procedures and treatment.'],
  ['LONG DISTANCE', 'Comfortable one-way, round-trip and multi-day travel across Ohio, Michigan and beyond.'],
  ['DIRECT SUPPORT', 'Call or text A2B directly when plans change or you need help with a booking.'],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="shell" style={{textAlign: 'center', paddingBlock: 72}}>
          <div className="eyebrow">PROFESSIONAL RIDES ACROSS OHIO &amp; MICHIGAN</div>
          <h1 style={{fontSize: 'clamp(3.4rem,10vw,7.5rem)', margin: '18px 0 20px'}}>HOP ON.<br /><span className="gold">OR SCHEDULE.</span></h1>
          <p className="muted" style={{fontSize: 20, maxWidth: 720, margin: '0 auto 30px'}}>Instant hop-on rides and scheduled pickups with live estimates, tracking and direct A2B support.</p>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link className="btn btn-gold" href="/hop">Hop On Now</Link>
            <Link className="btn btn-outline" href="/book">Schedule a Ride</Link>
            <a className="btn btn-outline" href="sms:14194555181">Text 419-455-5181</a>
          </div>
          <p className="muted" style={{marginTop: 18, fontSize: 14}}>Available 24/7 • Instant or reservation • Final fare confirmed before payment</p>
        </div>
      </section>
      <section id="services" className="shell section">
        <div className="eyebrow">SERVICES</div>
        <h2 style={{fontSize: 'clamp(2.2rem,6vw,3.8rem)', margin: '10px 0 28px'}}>ONE APP FOR NOW AND LATER.</h2>
        <div className="grid3">{services.map(([title, description]) => <article className="panel service-card" key={title}><h3 className="gold">{title}</h3><p className="muted">{description}</p></article>)}</div>
      </section>
      <section style={{background: '#0b0b0b', paddingBlock: 72}}>
        <div className="shell grid2">
          <div>
            <div className="eyebrow">HOW IT WORKS</div>
            <h2 style={{fontSize: 42}}>HOP IN MINUTES. PLAN AHEAD WHEN YOU NEED TO.</h2>
            <p className="muted">Choose Hop Now or pick a date and time. See the estimate, send the request, and track status in your passenger dashboard. Pay securely only after the final fare is locked.</p>
          </div>
          <div className="panel" style={{padding: 26}}>
            <ol style={{margin: 0, paddingLeft: 22}}>
              <li style={{marginBottom: 14}}>Open the Hop app and enter pickup and dropoff.</li>
              <li style={{marginBottom: 14}}>Ride now, or schedule a later window.</li>
              <li>Track the trip and pay after the fare is confirmed.</li>
            </ol>
            <Link className="btn btn-gold" style={{marginTop: 22}} href="/hop">Open Rider App</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
