import './globals.css'
import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'SIA - Discover High-Value Influencers for Your DTC Brand',
  description: 'Find untapped creators in your niche with our AI-powered hashtag analysis. Perfect for DTC brands looking to scale their influencer marketing.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-white font-sans">
        {children}
      </body>
    </html>
  )
}
