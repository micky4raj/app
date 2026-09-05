import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Jigyasa Fabrics — Premium Indian Fabrics, Sarees & Suit Sets',
  description: 'Shop premium Indian fabrics, silk sarees, cotton suit sets and designer textiles. Sold per meter, per piece or as bundled sets. Fast pan-India delivery.',
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
