import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import Script from 'next/script'

export const metadata = {
  title: 'Label Jigyasa — Hand Block Prints | Sanganer & Bagru',
  description: 'Authentic Sanganer & Bagru hand block prints from Rajasthan. Handcrafted pure cotton sarees, suit sets, dupattas & fabric-by-meter. Indian Hand, Global Heart — Since 2025.',
  applicationName: 'Label Jigyasa',
  keywords: ['Sanganer print', 'Bagru print', 'block print saree', 'hand block print', 'Rajasthani textiles', 'natural dye', 'dabu print', 'cotton suit set'],
  manifest: '/manifest.json',
  themeColor: '#8b1e3f',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Label Jigyasa',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: '#8b1e3f',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* iOS-specific PWA tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Label Jigyasa" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="msapplication-TileColor" content="#8b1e3f" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
      </head>
      <body className="font-sans antialiased bg-[#fff8f2] text-neutral-900">
        {children}
        <Toaster position="top-center" richColors />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch((e) => console.warn('SW register failed', e))
              })
            }
          `}
        </Script>
      </body>
    </html>
  )
}
