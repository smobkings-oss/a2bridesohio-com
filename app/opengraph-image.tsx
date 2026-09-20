import {ImageResponse} from 'next/og';

export const alt='A2B RIDES — Anytime. Anywhere.';
export const size={width:1200,height:630};
export const contentType='image/png';

export default function OpenGraphImage(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:'78px 92px',background:'#050505',color:'#fff',border:'18px solid #d4af37'}}><div style={{color:'#d4af37',fontSize:32,fontWeight:800,letterSpacing:8}}>PROFESSIONAL TRANSPORTATION</div><div style={{display:'flex',fontSize:112,fontWeight:950,marginTop:26,letterSpacing:-5}}><span>A2B</span><span style={{color:'#d4af37',marginLeft:28}}>RIDES</span></div><div style={{fontSize:54,fontWeight:800,marginTop:16}}>ANYTIME. ANYWHERE.</div><div style={{fontSize:27,color:'#d0d0d0',marginTop:36}}>Ohio &amp; Michigan · 419-455-5181</div></div>,size)}
