import type { Metadata } from 'next';
import './globals.css';
import PwaRegister from './components/PwaRegister';
import SiteChrome from './components/SiteChrome';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://a2bridesohio.com'),
  title: { default: 'A2B RIDES | Anytime, Anywhere', template: '%s | A2B RIDES' },
  description: 'Hop on instantly or schedule professional rides across Ohio and Michigan.',
  applicationName: 'A2B RIDES',
  openGraph: {type: 'website', siteName: 'A2B RIDES', title: 'A2B RIDES | Anytime, Anywhere', description: 'Instant hop-on rides and scheduled transportation across Ohio and Michigan.', url: '/', images: [{url: '/opengraph-image', width: 1200, height: 630, alt: 'A2B RIDES — Anytime. Anywhere.'}]},
  twitter: {card: 'summary_large_image', title: 'A2B RIDES | Anytime, Anywhere', description: 'Instant hop-on rides and scheduled transportation across Ohio and Michigan.', images: ['/opengraph-image']},
  appleWebApp: {capable: true, statusBarStyle: 'black-translucent', title: 'A2B RIDES'},
};

export const viewport = {themeColor: '#d4af37', colorScheme: 'dark'};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
