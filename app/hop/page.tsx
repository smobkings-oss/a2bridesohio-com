'use client';

import Link from 'next/link';
import {FormEvent, useEffect, useMemo, useState} from 'react';
import {easternPlusMinutes} from '../../lib/eastern';

type Mode = 'now' | 'scheduled';
type PaymentMethod = 'card' | 'cash';
type Place = {label: string; address: string};

const PLACES: Place[] = [
  {label: 'Downtown Toledo', address: '1 Government Center, Toledo, OH 43604'},
  {label: 'Toledo Express Airport (TOL)', address: '11013 Airport Hwy, Swanton, OH 43558'},
  {label: 'Promedica Toledo Hospital', address: '2142 N Cove Blvd, Toledo, OH 43606'},
  {label: 'Fifth Third Field', address: '2602 N Summit St, Toledo, OH 43611'},
  {label: 'Franklin Park Mall', address: '5001 Monroe St, Toledo, OH 43623'},
  {label: 'Levis Commons / Perrysburg', address: '3201 Levis Commons Blvd, Perrysburg, OH 43551'},
  {label: 'Arrowhead Park / Maumee', address: '1715 Indian Wood Circle, Maumee, OH 43537'},
  {label: 'Findlay', address: '200 E Main Cross St, Findlay, OH 45840'},
  {label: 'Fremont', address: '323 S Front St, Fremont, OH 43420'},
  {label: 'DTW Airport', address: 'Detroit Metropolitan Wayne County Airport, Detroit, MI'},
  {label: 'Cleveland Hopkins (CLE)', address: '5300 Riverside Dr, Cleveland, OH 44135'},
];

function statusCopy(status?: string) {
  const map: Record<string, string> = {
    New: 'Looking for a nearby A2B driver',
    Contacted: 'Dispatch is confirming your ride',
    Quoted: 'Final fare is ready',
    Scheduled: 'Your ride is on the calendar',
    Assigned: 'Driver assigned — heading your way soon',
    'En Route': 'Driver is on the way to you',
    Arrived: 'Your driver is here',
    'In Progress': 'You are on the trip',
    Completed: 'Trip complete',
    Canceled: 'This ride was canceled',
  };
  return map[status || ''] || 'Request received';
}

export default function HopApp() {
  const [account, setAccount] = useState<any>();
  const [rides, setRides] = useState<any[]>([]);
  const [mode, setMode] = useState<Mode>('now');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [airport, setAirport] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [fare, setFare] = useState<any>(null);
  const [loadingFare, setLoadingFare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState<any>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [picker, setPicker] = useState<'pickup' | 'dropoff' | null>(null);

  const activeRide = useMemo(
    () => rides.find(ride => !['Completed', 'Canceled'].includes(ride.status) && !ride.archived),
    [rides]
  );

  async function loadAccount() {
    try {
      const [accountResponse, ridesResponse] = await Promise.all([
        fetch('/api/account', {cache: 'no-store'}),
        fetch('/api/passenger/rides', {cache: 'no-store'}),
      ]);
      const accountResult = await accountResponse.json();
      setAccount(accountResult.account || null);
      if (ridesResponse.ok) setRides((await ridesResponse.json()).rides || []);
    } catch {
      setAccount(null);
    }
  }

  useEffect(() => {
    loadAccount();
    const timer = setInterval(loadAccount, 12000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = easternPlusMinutes(8);
    if (!date) setDate(now.date);
    if (!time) setTime(now.time);
  }, [date, time]);

  useEffect(() => {
    setFare(null);
    setSaved(null);
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
        if (!controller.signal.aborted) {
          setFare(quote);
          setMessage('');
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setFare(null);
          setMessage(error instanceof Error ? error.message : 'Unable to calculate fare.');
        }
      } finally {
        if (!controller.signal.aborted) setLoadingFare(false);
      }
    }, 550);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup, dropoff, airport, mode, date, time]);

  function usePlace(place: Place) {
    if (picker === 'pickup') setPickup(place.address);
    if (picker === 'dropoff') setDropoff(place.address);
    if (/airport/i.test(place.label)) setAirport(true);
    setPicker(null);
  }

  async function useCurrentLocation() {
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
          notes: `${mode === 'now' ? '[INSTANT HOP] ' : '[SCHEDULED] '}${notes}`.trim(),
          when: mode,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to place your ride.');
      setSaved(result);
      setMessage(mode === 'now' ? 'Hop request sent. Drivers nearby are being notified.' : 'Scheduled ride saved. Dispatch will confirm the window.');
      await loadAccount();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to place your ride.');
    } finally {
      setBusy(false);
    }
  }

  if (account === undefined) {
    return <main className="hop-shell"><div className="hop-card">Loading A2B Hop…</div></main>;
  }

  if (!account || account.role !== 'passenger') {
    return (
      <main className="hop-shell">
        <section className="hop-hero-mini">
          <p className="eyebrow">A2B HOP</p>
          <h1>Hop on in seconds.</h1>
          <p className="muted">Instant rides and scheduled pickups across Northwest Ohio and Michigan.</p>
          <Link className="btn btn-gold" href="/account?next=/hop">Sign in to hop</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="hop-shell">
      <header className="hop-top">
        <div>
          <p className="eyebrow">A2B HOP</p>
          <h1>{mode === 'now' ? 'Ride now' : 'Schedule a ride'}</h1>
          <p className="muted">Hi {account.name.split(' ')[0]}. Toledo · Perrysburg · Findlay · Fremont and beyond.</p>
        </div>
        <Link className="btn btn-outline" href="/passenger">My rides</Link>
      </header>

      {activeRide && !saved && (
        <article className="hop-live">
          <div>
            <span className="status-chip">{activeRide.status}</span>
            <strong>{statusCopy(activeRide.status)}</strong>
            <p>{activeRide.pickup} → {activeRide.dropoff}</p>
          </div>
          <Link className="btn btn-gold" href="/passenger">Track</Link>
        </article>
      )}

      <div className="hop-toggle" role="tablist">
        <button className={mode === 'now' ? 'on' : ''} onClick={() => setMode('now')} type="button">Hop now</button>
        <button className={mode === 'scheduled' ? 'on' : ''} onClick={() => setMode('scheduled')} type="button">Schedule</button>
      </div>

      <form className="hop-card hop-form" onSubmit={requestRide}>
        <label>
          Pickup
          <input className="input" required maxLength={300} placeholder="Where should we pick you up?" value={pickup} onChange={event => setPickup(event.target.value)} onFocus={() => setPicker('pickup')} />
        </label>
        <label>
          Dropoff
          <input className="input" required maxLength={300} placeholder="Where are you going?" value={dropoff} onChange={event => setDropoff(event.target.value)} onFocus={() => setPicker('dropoff')} />
        </label>
        <div className="hop-quick">
          <button type="button" className="chip" onClick={useCurrentLocation} disabled={geoBusy}>{geoBusy ? 'Locating…' : 'Use my location'}</button>
          <button type="button" className="chip" onClick={() => { const swap = pickup; setPickup(dropoff); setDropoff(swap); }}>Swap</button>
        </div>

        {picker && (
          <div className="place-list">
            <p className="eyebrow">{picker === 'pickup' ? 'Pickup suggestions' : 'Dropoff suggestions'}</p>
            {PLACES.map(place => (
              <button type="button" key={place.address} onClick={() => usePlace(place)}>
                <strong>{place.label}</strong>
                <span>{place.address}</span>
              </button>
            ))}
          </div>
        )}

        {mode === 'scheduled' && (
          <div className="grid2">
            <label>Date<input className="input" type="date" required value={date} onChange={event => setDate(event.target.value)} /></label>
            <label>Time (Eastern)<input className="input" type="time" required value={time} onChange={event => setTime(event.target.value)} /></label>
          </div>
        )}
        {mode === 'now' && <p className="muted">Pickup window: about 8 minutes from now, Eastern time. Dispatch still confirms the exact arrival.</p>}

        <div className="grid2">
          <label>Riders
            <select className="input" value={passengers} onChange={event => setPassengers(event.target.value)}>
              {[1, 2, 3, 4, 5, 6].map(count => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label className="panel check-card"><input type="checkbox" checked={airport} onChange={event => setAirport(event.target.checked)} /> Airport trip</label>
        </div>
        <label>Notes<textarea className="input" maxLength={1200} placeholder="Child seat, extra bags, gate number…" value={notes} onChange={event => setNotes(event.target.value)} /></label>

        <div className="fare-card">
          {loadingFare ? <span>Pricing your route…</span> : fare ? (
            <>
              <strong>${fare.total.toFixed(2)}</strong>
              <div>{fare.distanceMiles.toFixed(1)} mi · {Math.round(fare.durationMinutes)} min<br />{fare.surchargePercent ? `${fare.surchargePercent}% ${fare.label}` : 'Standard A2B rate'}</div>
            </>
          ) : <span>Enter pickup and dropoff for a live estimate.</span>}
        </div>

        <fieldset className="payment-choice">
          <legend>Pay</legend>
          <label><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Card after final fare</label>
          <label><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Cash</label>
        </fieldset>

        <button className="btn btn-gold hop-cta" disabled={busy || !!saved}>
          {busy ? 'Placing ride…' : saved ? 'Ride placed' : mode === 'now' ? 'Hop on this ride' : 'Schedule this ride'}
        </button>
        {message && <p className="notice" role="status">{message}</p>}
        {saved && (
          <div className="trip-actions">
            <Link className="btn btn-gold" href="/passenger">Open live dashboard</Link>
            <button type="button" className="btn btn-outline" onClick={() => { setSaved(null); setPickup(''); setDropoff(''); setNotes(''); }}>Book another</button>
          </div>
        )}
      </form>

      <nav className="hop-tabs">
        <Link href="/hop" className="on">Hop</Link>
        <Link href="/passenger">Rides</Link>
        <Link href="/account">Account</Link>
        <a href="tel:14194555181">Call</a>
      </nav>
    </main>
  );
}
