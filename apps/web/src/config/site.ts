export const SITE_URL = 'https://www.luthor.fyi';

export const SITE_NAME = 'Luthor';

export const SITE_DESCRIPTION =
  'Open-source Lexical editor for React, Next.js, Astro, and modern JS frameworks, built with love by developers for developers. Free forever by Lyfie.org.';

export const SITE_KEYWORDS = [
  'luthor',
  'luthor editor',
  'luthor rich text editor',
  'luthor lexical editor',
  'luthor headless editor',
  '@lyfie/luthor',
  '@lyfie/luthor-headless',
  'lyfie',
  'lyfie.org',
  'lexkit',
  'open source editor',
  'open source rich text editor',
  'open source lexical editor',
  'open source react rich text editor',
  'open source nextjs rich text editor',
  'open source astro rich text editor',
  'free rich text editor',
  'free open source rich text editor',
  'fully free text editor',
  'MIT licensed editor',
  'MIT licensed rich text editor',
  'javascript rich text editor',
  'typescript rich text editor',
  'web rich text editor',
  'framework rich text editor',
  'modern js framework editor',
  'react editor component',
  'react text editor',
  'Lexical rich text editor',
  'lexical editor',
  'lexical framework editor',
  'Lexical based rich text editor',
  'lexical typescript editor',
  'lexical headless editor',
  'lexical wysiwyg editor',
  'lexical editor for react',
  'React rich text editor',
  'react lexical editor',
  'react 18 rich text editor',
  'react 19 rich text editor',
  'next.js rich text editor',
  'nextjs rich text editor',
  'next.js lexical editor',
  'astro rich text editor',
  'astro lexical editor',
  'astro react editor',
  'vite rich text editor',
  'vite lexical editor',
  'remix rich text editor',
  'remix lexical editor',
  'esm rich text editor',
  'headless editor',
  'headless rich text editor',
  'headless lexical editor',
  'headless react editor',
  'wysiwyg editor',
  'markdown editor',
  'json editor output',
  'slash command editor',
  'developer text editor',
  'rich text editor for developers',
  'customizable rich text editor',
  'extensible rich text editor',
  'production ready editor',
  'production ready react editor',
  'react cms editor',
  'editor for ai apps',
  'editor for chat apps',
  'editor for blogging platform',
  'editor for email composer',
  'editor with typescript api',
  'lexical plugin editor',
  'best react based text editor',
  'lexical rich text editor react',
  'lyfie.org',
  'rahul ns anand',
  'rahul anand',
  'rahulnsanand',
  'rahulnsanand.com',
];

export const SOCIAL_CARD_PATH = '/social-card.svg';

export const PRIMARY_PACKAGE_NAME = '@lyfie/luthor';
export const HEADLESS_PACKAGE_NAME = '@lyfie/luthor-headless';
export const GITHUB_URL = 'https://github.com/lyfie-org/luthor';
export const NPM_URL = 'https://www.npmjs.com/package/@lyfie/luthor';
export const SPONSORS_URL = 'https://github.com/sponsors/lyfie-org';
export const REACT_PLAYGROUND_URL = 'https://stackblitz.com/edit/luthor-playground';
export const INSTALL_COMMAND = 'npm install @lyfie/luthor react react-dom';
export const GITHUB_CONTENT_BASE_URL = `${GITHUB_URL}/blob/main`;
export const MAINTAINER_ORG_NAME = 'Lyfie.org';
export const MAINTAINER_ORG_URL = 'https://lyfie.org';
export const CREATOR_NAME = 'Rahul Anand';
export const CREATOR_URL = 'https://www.rahulnsanand.com';
export const CREATOR_ROLE = `Creator and BDFL of ${MAINTAINER_ORG_NAME}`;

export const SEO_FAQS = [
  {
    question: 'Which package should I start with?',
    answer:
      `Start with ${PRIMARY_PACKAGE_NAME} for the fastest setup. Use ${HEADLESS_PACKAGE_NAME} when you need full custom UI control.`,
  },
  {
    question: 'Can I ship this in a commercial app?',
    answer:
      'Yes. It is MIT licensed and free for commercial use.',
  },
  {
    question: 'How fast can I get an editor on screen?',
    answer:
      `Usually in minutes. Install ${PRIMARY_PACKAGE_NAME}, import styles, and render ExtensiveEditor.`,
  },
  {
    question: `Do I need Lexical setup for ${PRIMARY_PACKAGE_NAME}?`,
    answer:
      'No extra setup is needed for the preset package. Headless is where you manage Lexical-level composition.',
  },
  {
    question: 'Can I switch from preset to headless later?',
    answer:
      `Yes. Start with ${PRIMARY_PACKAGE_NAME} and move to ${HEADLESS_PACKAGE_NAME} as your product needs deeper customization.`,
  },
  {
    question: 'What data format should I persist?',
    answer:
      'Use JSON for reliable round trips and database-friendly storage.',
  },
  {
    question: 'Is TypeScript support first-class?',
    answer:
      'Yes. The API surface is TypeScript-first for safer integrations and extension work.',
  },
] as const;
