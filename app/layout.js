import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'LABEL Jigyasa — Indian Hand, Global Heart | Premium Fabrics & Sarees',
  description: 'Handpicked premium Indian fabrics, silk sarees, cotton suit sets and designer textiles. Sold per meter, per piece or as bundled sets. Indian Hand, Global Heart — Since 2025.',
  icons: { icon: '/logo.jpg' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#fff8f2] text-neutral-900">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
