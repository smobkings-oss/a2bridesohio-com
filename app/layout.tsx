import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata={title:'A2B Rides Ohio | Anytime. Anywhere.',description:'Premium transportation across Ohio and Michigan. Local, airport, medical, event and long-distance rides.'};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><header style={{position:'sticky',top:0,zIndex:40,background:'rgba(5,5,5,.94)',borderBottom:'1px solid #222',backdropFilter:'blur(10px)'}}><div className="shell" style={{height:72,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14}}><Link href="/" style={{fontWeight:900,fontSize:20}}>A2B <span className="gold">RIDES OHIO</span></Link><nav className="navlinks" style={{display:'flex',gap:18,fontSize:14}}><Link href="/#services">Services</Link><Link href="/book">Book</Link><Link href="/drivers">Drive</Link><Link href="/#about">About</Link></nav><a className="btn btn-gold" href="sms:4194555181">Text Us</a></div></header>{children}<footer style={{borderTop:'1px solid #222',padding:'36px 0',marginTop:50}}><div className="shell" style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',gap:18}}><div><strong>A2B RIDES OHIO</strong><div className="muted">Anytime Anywhere Solutions LLC</div></div><div><a href="tel:14194555181">419-455-5181</a><br/><a href="mailto:a2brides@a2bridesohio.com">a2brides@a2bridesohio.com</a></div><div className="muted">© 2026 A2B Rides Ohio</div></div></footer></body></html>
} 