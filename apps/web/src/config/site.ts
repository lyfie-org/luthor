export const SITE_URL = 'https://www.luthor.fyi';

export const SITE_NAME = 'Luthor';

export const SITE_DESCRIPTION =
  'Open source React rich text editor built on Lexical with TypeScript-first APIs, production-ready presets, and a fully headless mode.';

export const SITE_KEYWORDS = [
  'luthor editor',
  'luthor',
  'open source react rich text editor',
  'Lexical rich text editor',
  'lexical editor for react',
  'React rich text editor',
  'best react based text editor',
  'best free open source rich text editor',
  'open source rich text editor',
  'TypeScript text editor',
  'MIT licensed editor',
  'headless editor',
  'lexical rich text editor react',
];

export const SOCIAL_CARD_PATH = '/social-card.svg';

export const PRIMARY_PACKAGE_NAME = '@lyfie/luthor';
export const HEADLESS_PACKAGE_NAME = '@lyfie/luthor-headless';
export const GITHUB_URL = 'https://github.com/lyfie-app/luthor';
export const NPM_URL = 'https://www.npmjs.com/package/@lyfie/luthor';
export const SPONSORS_URL = 'https://github.com/sponsors/lyfie-app';
export const REACT_PLAYGROUND_URL = 'https://stackblitz.com/edit/luthor-playground';
export const INSTALL_COMMAND = 'npm install @lyfie/luthor react react-dom';
export const GITHUB_CONTENT_BASE_URL = `${GITHUB_URL}/blob/main`;

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
