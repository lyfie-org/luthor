import { GITHUB_URL, NPM_URL, SEO_FAQS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';

export function HomeJsonLd() {
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description: SITE_DESCRIPTION,
      url: `${SITE_URL}/`,
      image: `${SITE_URL}/social-card.svg`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        category: 'Free',
      },
      license: 'https://opensource.org/license/mit',
      isAccessibleForFree: true,
      softwareVersion: '2.x',
      downloadUrl: NPM_URL,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: SITE_NAME,
      codeRepository: GITHUB_URL,
      codeSampleType: 'full',
      programmingLanguage: ['TypeScript', 'JavaScript'],
      runtimePlatform: 'Node.js',
      license: 'https://opensource.org/license/mit',
      url: `${SITE_URL}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: `${SITE_URL}/`,
      inLanguage: 'en-US',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      sameAs: [GITHUB_URL, NPM_URL],
      logo: `${SITE_URL}/favicon.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SEO_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
