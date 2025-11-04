"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview } from '../app/lib/gtag';
import { Analytics } from "@vercel/analytics/next"

// Simple Analytics client component — delegates to app/lib/gtag.js helpers.
export default function GA4Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const measurementId = process.env.NEXT_PUBLIC_GA_ID;
    if (!measurementId) return;

    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    try {
      pageview(url);
    } catch (e) {
      // swallow analytics errors
    }
  }, [pathname, searchParams]);

  return null;
}
