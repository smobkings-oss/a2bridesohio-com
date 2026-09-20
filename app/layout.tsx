import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import PwaRegister from './components/PwaRegister';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://a2bridesohio.com'),
  title: { default: 'A2B RIDES | Anytime, Anywhere', template: '%s | A2B RIDES' },
  description: 'Professional local, airport, medical, event and long-distance transportation across Ohio and Michigan.',
  applicationName:'A2B RIDES',
  openGraph:{type:'website',siteName:'A2B RIDES',title:'A2B RIDES | Anytime, Anywhere',description:'Professional transportation across Ohio and Michigan.',url:'/',images:[{url:'/opengraph-image',width:1200,height:630,alt:'A2B RIDES — Anytime. Anywhere.'}]},
  twitter:{card:'summary_large_image',title:'A2B RIDES | Anytime, Anywhere',description:'Professional transportation across Ohio and Michigan.',images:['/opengraph-image']},
  appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'A2B RIDES'},
};

export const viewport={themeColor:'#d4af37',colorScheme:'dark'};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister/>
    <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(5,5,5,.94)',borderBottom:'1px solid #252525',backdropFilter:'blur(12px)'}}>
      <div className="shell header-inner">
        <Link href="/" style={{fontWeight:950,fontSize:20,letterSpacing:'.02em'}}>A2B <span className="gold">RIDES</span></Link>
        <nav className="navlinks" aria-label="Main navigation"><Link href="/#services">Services</Link><Link href="/book">Book a Ride</Link><Link href="/drivers">Drive With Us</Link><Link href="/driver">Driver Login</Link><Link href="/account">Passenger Login</Link></nav>
        <Link className="btn btn-gold mobile-call" href="/account">Sign In</Link>
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
      <div className="shell" style={{marginTop:30,display:'flex',gap:18,flexWrap:'wrap',color:'#777',fontSize:13}}><span>© 2026 Anytime Anywhere Solutions LLC · A2B RIDES</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/install">Install App</Link></div>
    </footer>
  </body></html>;
}
