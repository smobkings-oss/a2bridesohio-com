import {createHmac,randomBytes,timingSafeEqual} from 'crypto';
import {cookies} from 'next/headers';

const NAME='a2b_admin';
const SESSION_SECONDS=60*60*12;

function secret(){
  const value=process.env.ADMIN_SESSION_SECRET;
  if(!value||value.length<32)throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters');
  return value;
}

function sign(payload:string){
  return createHmac('sha256',secret()).update(payload).digest('base64url');
}

export function adminCookieValue(){
  const payload=Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+SESSION_SECONDS,nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export async function isAdmin(){
  try{
    const value=(await cookies()).get(NAME)?.value;
    if(!value)return false;
    const [payload,signature,...rest]=value.split('.');
    if(!payload||!signature||rest.length)return false;
    const expected=Buffer.from(sign(payload));
    const actual=Buffer.from(signature);
    if(expected.length!==actual.length||!timingSafeEqual(expected,actual))return false;
    const parsed=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) as {exp?:number};
    return Number.isFinite(parsed.exp)&&Number(parsed.exp)>Math.floor(Date.now()/1000);
  }catch{return false}
}

export function credentialsMatch(value:unknown){
  const expected=process.env.ADMIN_PIN;
  if(!expected)return false;
  const supplied=String(value??'');
  const a=Buffer.from(expected),b=Buffer.from(supplied);
  return a.length===b.length&&timingSafeEqual(a,b);
}

export const adminCookieName=NAME;
export const adminSessionSeconds=SESSION_SECONDS;
