import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nexus-chat-web.vercel.app'),
  title: 'Nexus Chat — Fast, Private Real-Time Messaging & Calls',
  description: 'Next-generation real-time messaging, WebRTC calling, and AI-assisted collaboration.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Nexus Chat',
    description: 'Modern messaging. Fast, private, and focused with Gemini AI and WebRTC calling.',
    images: [{ url: '/app-cover.png', width: 1200, height: 1200, alt: 'Nexus Chat App Cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexus Chat',
    description: 'Modern messaging. Fast, private, and focused.',
    images: ['/app-cover.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
