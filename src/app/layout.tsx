import './globals.css'
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="min-h-screen bg-sports-bg text-sports-textLight font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
