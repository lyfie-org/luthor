import type { Metadata } from 'next';
import { Manrope, Sora } from 'next/font/google';
import '@lyfie/luthor/styles.css';
import './globals.css';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { RouteScrollManager } from '@/components/layout/route-scroll-manager';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { GITHUB_URL, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL, SOCIAL_CARD_PATH } from '@/config/site';

const THEME_STORAGE_KEY = 'luthor-site-theme';
const THEME_INIT_SCRIPT = `
(() => {
  try {
    const stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
    const theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

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
    default: `${SITE_NAME} | Open Source React Rich Text Editor for Lexical`,
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
    title: `${SITE_NAME} | Open Source React Rich Text Editor for Lexical`,
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
    title: `${SITE_NAME} | Open Source React Rich Text Editor for Lexical`,
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
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  other: {
    'github:repo': GITHUB_URL,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${manrope.variable} ${sora.variable}`}>
        <SiteHeader />
        <NavigationProgress />
        <RouteScrollManager />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
