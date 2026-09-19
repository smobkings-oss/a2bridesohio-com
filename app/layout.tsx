import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://a2bridesohio.com'),
  title: { default: 'A2B Rides Ohio | Anytime, Anywhere', template: '%s | A2B Rides Ohio' },
  description: 'Professional local, airport, medical, event and long-distance transportation across Ohio and Michigan.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(5,5,5,.94)',borderBottom:'1px solid #252525',backdropFilter:'blur(12px)'}}>
      <div className="shell header-inner">
        <Link href="/" style={{fontWeight:950,fontSize:20,letterSpacing:'.02em'}}>A2B <span className="gold">RIDES OHIO</span></Link>
        <nav className="navlinks" aria-label="Main navigation"><Link href="/#services">Services</Link><Link href="/book">Book a Ride</Link><Link href="/drivers">Drive With Us</Link><Link href="/#contact">Contact</Link></nav>
        <a className="btn btn-gold mobile-call" href="tel:14194555181">Call Now</a>
        <Link className="btn btn-gold navlinks" href="/book">Request a Ride</Link>
      </div>
    </header>
    {children}
    <footer id="contact" style={{borderTop:'1px solid #252525',padding:'42px 0',marginTop:56}}>
      <div className="shell grid3">
        <div><strong>A2B RIDES</strong><div className="muted">A DBA of Anytime Anywhere Solutions LLC</div></div>
        <div><strong>Call or text</strong><br/><a href="tel:14194555181">419-455-5181</a></div>
        <div><strong>Email</strong><br/><a href="mailto:a2brides@a2bridesohio.com">a2brides@a2bridesohio.com</a></div>
      </div>
      <div className="shell" style={{marginTop:30,display:'flex',gap:18,flexWrap:'wrap',color:'#777',fontSize:13}}><span>© 2026 A2B Rides Ohio</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
    </footer>
  </body></html>;
}
