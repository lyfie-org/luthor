import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import '@lyfie/luthor/styles.css';
import './globals.css';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { GITHUB_URL, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL, SOCIAL_CARD_PATH } from '@/config/site';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Open Source React Rich Text Editor`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'developer tools',
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Open Source React Rich Text Editor`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_CARD_PATH,
        alt: 'Luthor React rich text editor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@lyfieapp',
    creator: '@lyfieapp',
    title: `${SITE_NAME} | Open Source React Rich Text Editor`,
    description: SITE_DESCRIPTION,
    images: [SOCIAL_CARD_PATH],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: ['/favicon.ico', '/favicon.svg'],
    shortcut: ['/favicon.ico'],
  },
  other: {
    'github:repo': GITHUB_URL,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
