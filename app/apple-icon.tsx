import {ImageResponse} from 'next/og';

export const size={width:180,height:180};
export const contentType='image/png';

export default function AppleIcon(){return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#050505',border:'10px solid #d4af37',borderRadius:36,color:'#fff',fontSize:42,fontWeight:950,letterSpacing:-2}}><span>A2B</span><span style={{color:'#d4af37',marginLeft:7}}>R</span></div>,size)}
