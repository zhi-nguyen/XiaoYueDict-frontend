import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import QueryProvider from '@/context/QueryProvider'

export const metadata: Metadata = {
  title: 'CnenDict — Pronunciation Assessment',
  description: 'Pronunciation scoring for English and Chinese. Get word-level feedback in 5 seconds.',
  keywords: ['pronunciation', 'scoring', 'English', 'Chinese', 'Mandarin', 'HSK', 'IELTS'],
  openGraph: {
    title: 'CnenDict — Pronunciation Assessment',
    description: 'Pronunciation scoring for English and Chinese.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/logo.webp" />
        <link rel="apple-touch-icon" href="/logo.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lexend:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#334155" />
      </head>
      <body className="font-lexend text-primary bg-content-bg">
        <QueryProvider>
          <div className="flex h-screen w-full bg-content-bg overflow-hidden font-lexend text-primary">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <Header />
              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto flex flex-col justify-between">
                <div className="flex-1 flex flex-col">
                  {children}
                </div>
                <Footer />
                <ScrollToTop />
              </div>
            </div>
          </div>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
