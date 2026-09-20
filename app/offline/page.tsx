import Link from 'next/link';

export default function Offline(){return <main className="shell section"><div className="panel account-required"><div className="eyebrow">OFFLINE</div><h1>YOU’RE NOT CONNECTED</h1><p>Your account, booking, payment, and ride details are never stored in the offline cache. Reconnect to continue securely.</p><Link className="btn btn-gold" href="/">Try Again</Link></div></main>}
