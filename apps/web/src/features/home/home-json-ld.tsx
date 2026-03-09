import {
  CREATOR_NAME,
  CREATOR_ROLE,
  CREATOR_URL,
  GITHUB_URL,
  MAINTAINER_ORG_NAME,
  MAINTAINER_ORG_URL,
  NPM_URL,
  SEO_FAQS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from '@/config/site';
const softwareVersion = '2.x';
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const CREATOR_ID = `${SITE_URL}/#creator`;
const PRIMARY_NAV_LINKS = [
  { name: 'Home', url: `${SITE_URL}/` },
  { name: 'Getting Started', url: `${SITE_URL}/docs/getting-started/` },
  { name: 'Installation', url: `${SITE_URL}/docs/getting-started/installation/` },
  { name: 'Demo', url: `${SITE_URL}/demo/` },
  { name: 'Features', url: `${SITE_URL}/#features` },
  { name: 'Luthor Presets', url: `${SITE_URL}/docs/luthor/presets/` },
  { name: 'Headless Features', url: `${SITE_URL}/docs/luthor-headless/features/` },
];

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
      softwareVersion,
      downloadUrl: NPM_URL,
      publisher: { '@id': ORGANIZATION_ID },
      creator: { '@id': CREATOR_ID },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: SITE_NAME,
      codeRepository: GITHUB_URL,
      creator: { '@id': ORGANIZATION_ID },
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
      publisher: { '@id': ORGANIZATION_ID },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/docs/getting-started/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: MAINTAINER_ORG_NAME,
      url: MAINTAINER_ORG_URL,
      sameAs: [MAINTAINER_ORG_URL, 'https://github.com/lyfie-org', GITHUB_URL, NPM_URL],
      logo: `${SITE_URL}/favicon.svg`,
      founder: { '@id': CREATOR_ID },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': CREATOR_ID,
      name: CREATOR_NAME,
      url: CREATOR_URL,
      description: CREATOR_ROLE,
      sameAs: [CREATOR_URL],
      worksFor: { '@id': ORGANIZATION_ID },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SiteNavigationElement',
      name: PRIMARY_NAV_LINKS.map((item) => item.name),
      url: PRIMARY_NAV_LINKS.map((item) => item.url),
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
