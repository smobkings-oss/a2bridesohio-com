'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function HopRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/rider/');
  }, [router]);
  return <main className="hop-shell"><div className="hop-card">Opening the rider app…</div></main>;
}
