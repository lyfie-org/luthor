/**
 * Copyright (c) Luthor Team and contributors.
 * Open source under the MIT License (LICENSE).
 * Fork it. Remix it. Ship it.
 * Build freely. Credit kindly.
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function isInternalNavigationTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const anchor = target.closest('a');
  if (!anchor) return false;
  const href = anchor.getAttribute('href');
  if (!href) return false;
  if (href.startsWith('#')) return false;
  if (anchor.target === '_blank') return false;
  if (anchor.hasAttribute('download')) return false;
  if (/^(mailto:|tel:|https?:\/\/)/i.test(href)) return false;
  try {
    const targetUrl = new URL(href, window.location.href);
    const currentUrl = new URL(window.location.href);
    const isSameLocation =
      targetUrl.pathname === currentUrl.pathname &&
      targetUrl.search === currentUrl.search &&
      targetUrl.hash === currentUrl.hash;
    const isSameRouteDifferentHash =
      targetUrl.pathname === currentUrl.pathname &&
      targetUrl.search === currentUrl.search &&
      targetUrl.hash !== currentUrl.hash;
    if (isSameLocation) return false;
    if (isSameRouteDifferentHash) return false;
  } catch {
    return false;
  }
  return true;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const watchdogRef = useRef<number | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!isInternalNavigationTarget(event.target)) return;

      setIsLoading(true);
    };

    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (watchdogRef.current) {
        window.clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
      return;
    }

    if (watchdogRef.current) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    watchdogRef.current = window.setTimeout(() => {
      setIsLoading(false);
      watchdogRef.current = null;
    }, 10000);
  }, [isLoading]);

  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (watchdogRef.current) {
        window.clearTimeout(watchdogRef.current);
      }
    };
  }, []);

  return (
    <div className={`nav-progress ${isLoading ? 'is-active' : ''}`} role="status" aria-live="polite" aria-label="Page loading indicator">
      <span className="nav-progress-bar" />
    </div>
  );
}
