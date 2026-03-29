/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      {
        source: '/docs/getting-started/luthor/',
        destination: '/docs/luthor/overview/',
        permanent: true,
      },
      {
        source: '/docs/getting-started/luthor-headless/',
        destination: '/docs/luthor-headless/overview/',
        permanent: true,
      },
      {
        source: '/docs/luthor/',
        destination: '/docs/luthor/overview/',
        permanent: true,
      },
      {
        source: '/docs/luthor-headless/',
        destination: '/docs/luthor-headless/overview/',
        permanent: true,
      },
      {
        source: '/docs/integrations/',
        destination: '/docs/integrations/react/',
        permanent: true,
      },
      {
        source: '/docs/reference/',
        destination: '/docs/reference/search-guide/',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/:all*(svg|png|jpg|jpeg|gif|webp|avif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
