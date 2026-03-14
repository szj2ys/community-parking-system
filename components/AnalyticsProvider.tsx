'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, trackPageView } from '@/lib/analytics';

/**
 * Analytics Provider
 * Wraps the app to automatically track page views
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize analytics on mount
    initAnalytics();
  }, []);

  useEffect(() => {
    // Track page view when pathname changes
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}

export default AnalyticsProvider;
