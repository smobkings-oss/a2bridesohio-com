import {NextResponse} from 'next/server';
import {currentAccount} from '../../../../../lib/account';
import {db} from '../../../../../lib/db';
import {sameOrigin} from '../../../../../lib/http';

const LOCKED = new Set(['Completed', 'Canceled', 'In Progress']);

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({error: 'Forbidden'}, {status: 403});
  const account = await currentAccount();
  if (!account || account.profile.role !== 'passenger') return NextResponse.json({error: 'Sign in as a rider first.'}, {status: 401});
  const input = await req.json().catch(() => ({}));
  if (typeof input.id !== 'string') return NextResponse.json({error: 'Ride id required.'}, {status: 400});
  const service = db();
  const {data, error} = await service.from('ride_requests').select('id,status,passenger_id').eq('id', input.id).eq('passenger_id', account.user.id).maybeSingle();
  if (error) return NextResponse.json({error: 'Unable to find that ride.'}, {status: 500});
  if (!data) return NextResponse.json({error: 'Ride not found.'}, {status: 404});
  if (LOCKED.has(data.status)) return NextResponse.json({error: `A ${data.status.toLowerCase()} ride cannot be canceled here.`}, {status: 409});
  const update = await service.from('ride_requests').update({status: 'Canceled', updated_at: new Date().toISOString()}).eq('id', data.id).eq('passenger_id', account.user.id);
  if (update.error) return NextResponse.json({error: 'Unable to cancel this ride.'}, {status: 500});
  return NextResponse.json({ok: true, id: data.id, status: 'Canceled'});
}
