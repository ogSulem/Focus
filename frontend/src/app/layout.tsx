import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { ThemeScript } from '@/components/theme-script';
import { RouteProgress } from '@/components/route-progress';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';

export const metadata: Metadata = {
  title: { default: 'Focus', template: '%s | Focus' },
  description:
    'Your AI-powered productivity hub — tasks, habits, focus timer, and insights in one beautiful app.',
  manifest: '/manifest.json',
  authors: [{ name: 'Focus' }],
  keywords: [
    'productivity',
    'habits',
    'pomodoro',
    'task management',
    'focus timer',
    'kanban',
    'analytics',
    'habit tracker',
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Focus',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Focus — AI Productivity Hub',
    description:
      'Your AI-powered productivity hub — tasks, habits, focus timer, and insights in one beautiful app.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Focus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Focus — AI Productivity Hub',
    description:
      'Your AI-powered productivity hub — tasks, habits, focus timer, and insights in one beautiful app.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f4f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <RouteProgress />
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
