import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://zipstor.vercel.app'),
  title: 'ZipStor — Free Online Video Compressor | No Upload',
  description:
    'Compress video files right in your browser. 100% private — your videos never leave your device. Free, no sign-up, works on iPhone, Android, Mac & PC.',
  applicationName: 'ZipStor',
  manifest: '/manifest.json',
  keywords: [
    'video compressor',
    'compress video online',
    'reduce video file size',
    'iPhone video compression',
    'ffmpeg wasm',
    'free video compressor',
    'video size reducer',
    'compress mp4',
    '아이폰 동영상 용량 줄이기',
    '동영상 압축',
  ],
  authors: [{ name: 'ZipStor' }],
  openGraph: {
    type: 'website',
    siteName: 'ZipStor',
    title: 'ZipStor — Free Online Video Compressor',
    description:
      'Compress videos right in your browser. No uploads, 100% private, free forever.',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ZipStor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZipStor — Free Online Video Compressor',
    description:
      'Compress videos right in your browser. No uploads, 100% private, free forever.',
    images: ['/icons/icon-512.png'],
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="google" content="notranslate" />
        <meta name="google-site-verification" content="1lIW9GOBqAQlPNFUEqsiRHD7O5kFZQkjw21M_4zK72g" />
        <meta name="google-adsense-account" content="ca-pub-4890153059682539" />
      </head>
      <body className={`${inter.className} notranslate`} suppressHydrationWarning>
        {children}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4890153059682539"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
