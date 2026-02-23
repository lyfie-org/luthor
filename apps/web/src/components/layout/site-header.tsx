'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'luthor-site-theme';

type Theme = 'light' | 'dark';

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SiteHeader() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const nextTheme = readInitialTheme();
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
  }

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link className="brand" href="/">
          Luthor
        </Link>
        <nav className="site-nav" aria-label="Primary">
          <Link href="/docs/">Documentation</Link>
          <Link href="/demo/">Demo</Link>
          <Link href="/llms.txt">LLMs</Link>
          <a href="https://github.com/lyfie-app/luthor" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle color theme">
            {mounted ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
          </button>
        </nav>
      </div>
    </header>
  );
}
