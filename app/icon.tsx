import {ImageResponse} from 'next/og';

export const size={width:512,height:512};
export const contentType='image/png';

export default function Icon(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#050505',border:'28px solid #d4af37',borderRadius:96,color:'#fff',fontSize:112,fontWeight:950,letterSpacing:-6}}><span>A2B</span><span style={{color:'#d4af37',marginLeft:18}}>R</span></div>,size)}
