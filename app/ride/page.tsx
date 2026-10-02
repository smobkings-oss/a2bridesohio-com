'use client';

import Link from 'next/link';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useRouter} from 'next/navigation';
import ProfilePhoto from '../components/ProfilePhoto';
import {easternPlusMinutes} from '../../lib/eastern';

type Mode = 'now' | 'scheduled';
type Tab = 'hop' | 'trips' | 'me';
type Pay = 'card' | 'cash';
type Place = {label: string; address: string; tag: string};

const PLACES: Place[] = [
  {label: 'Downtown Toledo', address: '1 Government Center, Toledo, OH 43604', tag: 'City'},
  {label: 'Toledo Express Airport (TOL)', address: '11013 Airport Hwy, Swanton, OH 43558', tag: 'Airport'},
  {label: 'ProMedica Toledo Hospital', address: '2142 N Cove Blvd, Toledo, OH 43606', tag: 'Medical'},
  {label: 'Fifth Third Field', address: '2602 N Summit St, Toledo, OH 43611', tag: 'Event'},
  {label: 'Franklin Park Mall', address: '5001 Monroe St, Toledo, OH 43623', tag: 'Shop'},
  {label: 'Levis Commons / Perrysburg', address: '3201 Levis Commons Blvd, Perrysburg, OH 43551', tag: 'Perrysburg'},
  {label: 'Arrowhead Park / Maumee', address: '1715 Indian Wood Circle, Maumee, OH 43537', tag: 'Maumee'},
  {label: 'Hollywood Casino Toledo', address: '1968 Miami St, Toledo, OH 43605', tag: 'Night'},
  {label: 'University of Toledo', address: '2801 W Bancroft St, Toledo, OH 43606', tag: 'Campus'},
  {label: 'Findlay', address: '200 E Main Cross St, Findlay, OH 45840', tag: 'Findlay'},
  {label: 'Fremont', address: '323 S Front St, Fremont, OH 43420', tag: 'Fremont'},
  {label: 'Tiffin', address: '51 E Market St, Tiffin, OH 44883', tag: 'Tiffin'},
  {label: 'DTW Airport', address: 'Detroit Metropolitan Wayne County Airport, Detroit, MI', tag: 'Airport'},
  {label: 'Cleveland Hopkins (CLE)', address: '5300 Riverside Dr, Cleveland, OH 44135', tag: 'Airport'},
];

const CLASSES = [
  {id: 'standard', name: 'A2B Standard', detail: 'Everyday sedan. Best for 1–3 riders.'},
  {id: 'comfort', name: 'A2B Comfort', detail: 'More room, quieter cabin, extra bags.'},
  {id: 'tesla', name: 'Tesla Navigator', detail: 'Model 3 when a fleet car is free. Dispatch confirms.'},
];

function statusCopy(status?: string) {
  const map: Record<string, string> = {
    New: 'Looking for a nearby A2B driver',
    Contacted: 'Dispatch is confirming your ride',
    Quoted: 'Final fare is ready',
    Scheduled: 'Locked on the calendar',
    Assigned: 'Driver assigned',
    'En Route': 'Driver is on the way',
    Arrived: 'Your driver is here',
    'In Progress': 'You are on the trip',
    Completed: 'Trip complete',
    Canceled: 'Canceled',
  };
  return map[status || ''] || 'Request received';
}

function money(cents?: number | null) {
  if (cents == null) return 'Quote pending';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function RiderApp() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('hop');
  const [account, setAccount] = useState<any>();
  const [rides, setRides] = useState<any[]>([]);
  const [mode, setMode] = useState<Mode>('now');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [rideClass, setRideClass] = useState('standard');
  const [airport, setAirport] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Pay>('card');
  const [fare, setFare] = useState<any>(null);
  const [loadingFare, setLoadingFare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [picker, setPicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [query, setQuery] = useState('');

  const activeRide = useMemo(
    () => rides.find(ride => !['Completed', 'Canceled'].includes(ride.status)),
    [rides]
  );

  async function load() {
    const [accountResponse, ridesResponse] = await Promise.all([
      fetch('/api/account', {cache: 'no-store'}),
      fetch('/api/passenger/rides', {cache: 'no-store'}),
    ]);
    const accountResult = await accountResponse.json();
    setAccount(accountResult.account || null);
    if (ridesResponse.ok) setRides((await ridesResponse.json()).rides || []);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'scheduled') setMode('scheduled');
    if (params.get('tab') === 'trips') setTab('trips');
    load().catch(() => setAccount(null));
    const timer = setInterval(() => load().catch(() => undefined), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = easternPlusMinutes(45);
    if (!date) setDate(now.date);
    if (!time) setTime(now.time);
  }, [date, time]);

  useEffect(() => {
    setFare(null);
    if (pickup.trim().length < 5 || dropoff.trim().length < 5) return;
    const when = mode === 'now' ? easternPlusMinutes(8) : {date, time};
    if (!when.date || !when.time) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingFare(true);
      try {
        const response = await fetch('/api/fare', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({pickup, dropoff, airport, date: when.date, time: when.time}),
          signal: controller.signal,
        });
        const quote = await response.json();
        if (!response.ok) throw new Error(quote.error || 'Unable to calculate fare.');
        if (!controller.signal.aborted) setFare(quote);
      } catch (error) {
        if (!controller.signal.aborted) {
          setFare(null);
          setMessage(error instanceof Error ? error.message : 'Unable to calculate fare.');
        }
      } finally {
        if (!controller.signal.aborted) setLoadingFare(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup, dropoff, airport, mode, date, time]);

  const suggestions = PLACES.filter(place => {
    const hay = `${place.label} ${place.address} ${place.tag}`.toLowerCase();
    return !query || hay.includes(query.toLowerCase());
  });

  function usePlace(place: Place) {
    if (picker === 'pickup') setPickup(place.address);
    if (picker === 'dropoff') setDropoff(place.address);
    if (/airport/i.test(place.label + place.tag)) setAirport(true);
    setPicker(null);
    setQuery('');
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage('Location is not available in this browser.');
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setPickup(`Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)}), Northwest Ohio`);
        setPicker(null);
        setGeoBusy(false);
      },
      () => {
        setMessage('Turn on location or type your pickup address.');
        setGeoBusy(false);
      },
      {enableHighAccuracy: true, timeout: 8000}
    );
  }

  async function requestRide(event: FormEvent) {
    event.preventDefault();
    if (busy || saved) return;
    setBusy(true);
    setMessage('');
    try {
      const when = mode === 'now' ? easternPlusMinutes(8) : {date, time};
      const klass = CLASSES.find(item => item.id === rideClass);
      const response = await fetch('/api/ride-requests', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          pickup,
          dropoff,
          date: when.date,
          time: when.time,
          passengers,
          airport,
          paymentMethod,
          notes: `[CLASS:${klass?.name || 'A2B Standard'}] ${notes}`.trim(),
          when: mode,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to place your ride.');
      setSaved(result);
      setMessage(mode === 'now' ? 'Hop order sent. Nearby drivers are being offered the trip.' : 'Scheduled ride saved. A2B will confirm the window.');
      setTab('trips');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to place your ride.');
    } finally {
      setBusy(false);
    }
  }

  async function cancelRide(id: string) {
    if (!window.confirm('Cancel this ride?')) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/passenger/rides/cancel', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({id}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to cancel.');
      setMessage('Ride canceled.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to cancel.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/account', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({action: 'logout'})});
    router.push('/account?next=/ride');
    router.refresh();
  }

  if (account === undefined) {
    return <main className="ride-app"><div className="ride-card">Opening A2B Rider…</div></main>;
  }

  if (!account || account.role !== 'passenger') {
    return (
      <main className="ride-app">
        <section className="ride-gate">
          <p className="eyebrow">A2B RIDER</p>
          <h1>Hop on now.<br /><span className="gold">Or schedule it.</span></h1>
          <p className="muted">Instant pickups and later reservations across Toledo, Perrysburg, Findlay, Fremont and airport runs.</p>
          <Link className="btn btn-gold ride-cta" href="/account?next=/ride">Sign in to place a ride</Link>
          <Link className="btn btn-outline ride-cta" href="/account?next=/ride">Create a rider account</Link>
          <a className="muted" href="sms:14194555181">Text 419-455-5181</a>
        </section>
      </main>
    );
  }

  return (
    <main className="ride-app">
      <header className="ride-top">
        <div>
          <p className="eyebrow">A2B RIDER</p>
          <h1>{tab === 'trips' ? 'Your rides' : tab === 'me' ? account.name.split(' ')[0] : mode === 'now' ? 'Hop on' : 'Schedule'}</h1>
        </div>
        <a className="chip" href="tel:14194555181">419-455-5181</a>
      </header>

      {tab === 'hop' && (
        <>
          <div className="ride-map" aria-hidden="true">
            <span className="pin pickup">Pickup</span>
            <span className="pin drop">Dropoff</span>
            <span className="road a" />
            <span className="road b" />
          </div>
          {activeRide && !saved && (
            <button className="ride-live" type="button" onClick={() => setTab('trips')}>
              <span className="status-chip">{activeRide.status}</span>
              <strong>{statusCopy(activeRide.status)}</strong>
              <small>{activeRide.pickup} → {activeRide.dropoff}</small>
            </button>
          )}
          <div className="hop-toggle" role="tablist">
            <button className={mode === 'now' ? 'on' : ''} type="button" onClick={() => { setMode('now'); setSaved(null); }}>Hop now</button>
            <button className={mode === 'scheduled' ? 'on' : ''} type="button" onClick={() => { setMode('scheduled'); setSaved(null); }}>Schedule</button>
          </div>
          <form className="ride-card" onSubmit={requestRide}>
            <label>Pickup
              <input className="input" required maxLength={300} placeholder="Where should we pick you up?" value={pickup} onChange={event => setPickup(event.target.value)} onFocus={() => { setPicker('pickup'); setQuery(''); }} />
            </label>
            <label>Dropoff
              <input className="input" required maxLength={300} placeholder="Where are you going?" value={dropoff} onChange={event => setDropoff(event.target.value)} onFocus={() => { setPicker('dropoff'); setQuery(''); }} />
            </label>
            <div className="hop-quick">
              <button type="button" className="chip" onClick={useCurrentLocation} disabled={geoBusy}>{geoBusy ? 'Locating…' : 'Use my location'}</button>
              <button type="button" className="chip" onClick={() => { const swap = pickup; setPickup(dropoff); setDropoff(swap); }}>Swap</button>
            </div>
            {picker && (
              <div className="place-list">
                <input className="input" placeholder="Search Toledo, airports, hospitals…" value={query} onChange={event => setQuery(event.target.value)} />
                {suggestions.map(place => (
                  <button type="button" key={place.address} onClick={() => usePlace(place)}>
                    <strong>{place.label}</strong>
                    <span>{place.tag} · {place.address}</span>
                  </button>
                ))}
              </div>
            )}
            {mode === 'scheduled' ? (
              <div className="grid2">
                <label>Date<input className="input" type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
                <label>Time (Eastern)<input className="input" type="time" required value={time} onChange={event => setTime(event.target.value)} /></label>
              </div>
            ) : <p className="muted">Instant hop. Pickup window starts about 8 minutes from now. A driver still confirms arrival.</p>}
            <div className="class-row">
              {CLASSES.map(item => (
                <button type="button" key={item.id} className={rideClass === item.id ? 'class-card on' : 'class-card'} onClick={() => setRideClass(item.id)}>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </button>
              ))}
            </div>
            <div className="grid2">
              <label>Riders
                <select className="input" value={passengers} onChange={event => setPassengers(event.target.value)}>
                  {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count}</option>)}
                </select>
              </label>
              <label className="panel check-card"><input type="checkbox" checked={airport} onChange={event => setAirport(event.target.checked)} /> Airport trip</label>
            </div>
            <label>Notes<textarea className="input" maxLength={900} placeholder="Gate, child seat, extra bags…" value={notes} onChange={event => setNotes(event.target.value)} /></label>
            <div className="fare-card">
              {loadingFare ? <span>Pricing your route…</span> : fare ? (
                <>
                  <strong>${Number(fare.total).toFixed(2)}</strong>
                  <div>{Number(fare.distanceMiles).toFixed(1)} mi · {Math.round(fare.durationMinutes)} min<br />{fare.surchargePercent ? `${fare.surchargePercent}% ${fare.label}` : 'Standard A2B rate'}</div>
                </>
              ) : <span>Enter pickup and dropoff for a live estimate.</span>}
            </div>
            <fieldset className="payment-choice">
              <legend>Pay</legend>
              <label><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Card after final fare</label>
              <label><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Cash</label>
            </fieldset>
            <button className="btn btn-gold ride-cta" disabled={busy || !!saved}>
              {busy ? 'Placing order…' : saved ? 'Order placed' : mode === 'now' ? 'Place instant ride' : 'Place scheduled ride'}
            </button>
            {message && <p className="notice" role="status">{message}</p>}
          </form>
        </>
      )}

      {tab === 'trips' && (
        <section className="ride-list">
          {message && <p className="notice" role="status">{message}</p>}
          {saved && <p className="notice">Ride {saved.id} is in. Estimate {saved.quotePending ? 'pending route check' : money(saved.fareEstimateCents)}.</p>}
          {!rides.length && <div className="ride-card empty-state"><h3>No rides yet</h3><p className="muted">Hop now or schedule one for later.</p></div>}
          {rides.map(ride => (
            <article className="ride-card" key={ride.id}>
              <div className="trip-top">
                <span className="status-chip">{ride.status}</span>
                <strong>{money(ride.fare_locked ? ride.locked_fare_cents : ride.fare_estimate_cents)}</strong>
              </div>
              <p>{statusCopy(ride.status)}</p>
              <strong>{ride.pickup}</strong>
              <div className="gold">to {ride.dropoff}</div>
              <p className="muted">{String(ride.notes || '').includes('[INSTANT HOP]') ? 'Instant' : 'Scheduled'} · {ride.ride_date} at {String(ride.ride_time || '').slice(0, 5)} · {ride.payment_method} · {ride.payment_status}</p>
              {ride.driver && <p>Driver {ride.driver.name} · {ride.driver.vehicle}</p>}
              {!['Completed', 'Canceled', 'In Progress'].includes(ride.status) && (
                <button className="btn btn-outline" type="button" disabled={busy} onClick={() => cancelRide(ride.id)}>Cancel ride</button>
              )}
            </article>
          ))}
        </section>
      )}

      {tab === 'me' && (
        <section className="ride-card">
          <ProfilePhoto />
          <p><strong>{account.name}</strong></p>
          <p className="muted">{account.phone}<br />{account.email}</p>
          <p className="muted">Service area: Toledo, Perrysburg, Maumee, Findlay, Fremont, Tiffin, plus DTW and CLE airport runs.</p>
          <button className="btn btn-outline" type="button" onClick={logout}>Sign out</button>
          <Link className="btn btn-gold" href="/passenger">Open full dashboard</Link>
        </section>
      )}

      <nav className="ride-tabs">
        <button type="button" className={tab === 'hop' ? 'on' : ''} onClick={() => setTab('hop')}>Hop</button>
        <button type="button" className={tab === 'trips' ? 'on' : ''} onClick={() => setTab('trips')}>Trips</button>
        <button type="button" className={tab === 'me' ? 'on' : ''} onClick={() => setTab('me')}>Me</button>
      </nav>
    </main>
  );
}
