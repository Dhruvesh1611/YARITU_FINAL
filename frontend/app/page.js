// app/page.js

import HomePageClient from './HomePageClient';

// Server-component: fetch initial data once on the server and pass to the
// client component to avoid client-side fetch jitter and improve replace/delete UX.
export default async function Home() {
  // Fetch the public read endpoints server-side. Use no-store to ensure
  // we get fresh DB-backed results (these endpoints are dynamic/runtime=nodejs).
  const [heroRes, storesRes, trendingRes, offersRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/hero`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/stores`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/trending`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/offers`, { cache: 'no-store' }),
  ]).catch(() => [null, null, null, null]);

  const parse = async (res) => {
    try {
      if (!res || !res.ok) return [];
      const j = await res.json().catch(() => null);
      return (j && j.success && Array.isArray(j.data)) ? j.data : [];
    } catch (e) {
      return [];
    }
  };

  const [initialHeroItems, initialStores, initialTrendingVideos, initialOffers] = await Promise.all([
    parse(heroRes),
    parse(storesRes),
    parse(trendingRes),
    parse(offersRes),
  ]);

  return (
    // HomePageClient is a client component that accepts initial data props
    // and avoids client fetching when possible.
    <HomePageClient
      initialHeroItems={initialHeroItems}
      initialStores={initialStores}
      initialTrendingVideos={initialTrendingVideos}
      initialOffers={initialOffers}
    />
  );
}