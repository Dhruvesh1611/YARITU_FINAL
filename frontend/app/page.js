// app/page.js

import HomePageClient from './HomePageClient';

// Server par data fetch karne ke liye helper function
async function getHomepageData() {
  try {
    // Apne server ka poora URL yahan daalein
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const [heroRes, storesRes, trendingRes] = await Promise.all([
      fetch(`${baseUrl}/api/hero`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/stores`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/trending`, { cache: 'no-store' }),
    ]);

    const heroItems = await heroRes.json();
    const stores = await storesRes.json();
    const trendingVideos = await trendingRes.json();

    return {
      heroItems: heroItems.success ? heroItems.data : [],
      stores: stores.success ? stores.data : [],
      trendingVideos: trendingVideos.success ? trendingVideos.data : [],
    };
  } catch (error) {
    console.error("Failed to fetch homepage data on server:", error);
    // Error hone par khaali data bhejein
    return {
      heroItems: [],
      stores: [],
      trendingVideos: [],
    };
  }
}

// Yeh ab ek Server Component hai
export default async function Home() {
  // Server par data fetch karein
  const { heroItems, stores, trendingVideos } = await getHomepageData();

  // Data ko Client Component mein as props bhej dein
  return (
    <HomePageClient 
      initialHeroItems={heroItems}
      initialStores={stores}
      initialTrendingVideos={trendingVideos}
    />
  );
}