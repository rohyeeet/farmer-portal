import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Lato } from 'next/font/google'
import { Providers } from './providers'
import '../styles/app/globals.css'

const lato = Lato({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
  style: ['normal', 'italic'],
  variable: '--fp-font-lato',
})

export const metadata: Metadata = {
  title: 'Farmer Portal',
  icons: { icon: '/varaha_logo.png' },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={lato.variable}>
      <body className={lato.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
