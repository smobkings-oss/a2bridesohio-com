'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

export default function SiteChrome({children}: {children: React.ReactNode}) {
  const path = usePathname();
  const appMode = path === '/ride' || path.startsWith('/ride/');
  if (appMode) return <>{children}</>;
  return (
    <>
      <header style={{position: 'sticky', top: 0, zIndex: 40, background: 'rgba(5,5,5,.94)', borderBottom: '1px solid #252525', backdropFilter: 'blur(12px)'}}>
        <div className="shell header-inner">
          <Link href="/" style={{fontWeight: 950, fontSize: 20, letterSpacing: '.02em'}}>A2B <span className="gold">RIDES</span></Link>
          <nav className="navlinks" aria-label="Main navigation">
            <Link href="/ride">Rider App</Link>
            <Link href="/book">Schedule</Link>
            <Link href="/#services">Services</Link>
            <Link href="/drivers">Drive With Us</Link>
            <Link href="/driver">Driver Login</Link>
            <Link href="/account">Passenger Login</Link>
          </nav>
          <Link className="btn btn-gold mobile-call" href="/ride">Hop Now</Link>
          <Link className="btn btn-gold navlinks" href="/ride">Hop Now</Link>
        </div>
      </header>
      {children}
      <footer id="contact" style={{borderTop: '1px solid #252525', padding: '42px 0', marginTop: 56}}>
        <div className="shell grid3">
          <div><strong>A2B RIDES</strong><div className="muted">A DBA of Anytime Anywhere Solutions LLC</div></div>
          <div><strong>Call or text</strong><br /><a href="tel:14194555181">419-455-5181</a></div>
          <div><strong>Email</strong><br /><a href="mailto:a2brides@a2bridesohio.com">a2brides@a2bridesohio.com</a></div>
        </div>
        <div className="shell" style={{marginTop: 30, display: 'flex', gap: 18, flexWrap: 'wrap', color: '#777', fontSize: 13}}>
          <span>© 2026 Anytime Anywhere Solutions LLC · A2B RIDES</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/install">Install App</Link>
          <Link href="/ride">Rider App</Link>
        </div>
      </footer>
    </>
  );
}
