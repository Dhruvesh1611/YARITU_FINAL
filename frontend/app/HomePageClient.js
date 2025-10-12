// app/HomePageClient.js

"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './home.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

// Components
import MultipleOffers from '../components/MultipleOffers';
import StayClassy from '../components/StayClassy';
import CelebritySection from '../components/CelebritySection';
import TestimonialsSlider from '../components/TestimonialsSlider';
import ImageSlider from '../components/ImageSlider';
import HowItWorks from '../components/HowItWorks';
import StoreCard from '../components/StoreCard';
import AddStoreModal from '../components/AddStoreModal';
import HeroImageCard from '../components/HeroImageCard';
import AddHeroModal from '../components/AddHeroModal';
import TrendingVideoCard from '../components/TrendingVideoCard';

// Yeh local fallback array abhi bhi zaroori hai agar server se data na aaye
const heroImages = [
  '/images/hero1.png',
  '/images/hero2.png',
  '/images/hero3.png'
];

export default function HomePageClient({ initialHeroItems, initialStores, initialTrendingVideos }) {
  const router = useRouter();
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  
  // State ko server se mile initial data se shuru karein
  const [stores, setStores] = useState(initialStores || []);
  const [heroItems, setHeroItems] = useState(initialHeroItems || []);
  const [trendingVideos, setTrendingVideos] = useState(initialTrendingVideos || []);

  const { data: session } = useSession();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAddHeroOpen, setIsAddHeroOpen] = useState(false);
  const [replacePosition, setReplacePosition] = useState(null);
  const fileInputRef = useRef(null);
  const [replacing, setReplacing] = useState(false);
  
  const trendingContainerRef = useRef(null);
  const centerImageRef = useRef(null); 
  const featuredContainerRef = useRef(null);

  // Data fetching wala useEffect hata diya gaya hai, baki sab waisa hi hai
  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroImage(prev => (prev + 1) % (heroItems.length > 0 ? heroItems.length : heroImages.length));
    }, 3000);

    const initializeScrollPositions = () => {
      if (featuredContainerRef.current) {
        featuredContainerRef.current.scrollLeft = 300; 
      }
    };

    const timer = setTimeout(initializeScrollPositions, 100);

    return () => {
      clearInterval(heroInterval);
      clearTimeout(timer);
    };
  }, [heroItems.length]);

  // Baaki ke saare useEffects (scroll, video playback etc.) waise hi rahenge...
  // ... [Yahan par aapke baki ke useEffects ka code waisa hi rahega] ...
  // Effect to center trending section when it comes into view
  useEffect(() => {
    const trendingContainer = trendingContainerRef.current;
    const imageToCenter = centerImageRef.current;

    if (!trendingContainer || !imageToCenter) return;

    const centerTrendingView = () => {
      // For mobile/tablet scrolling views, we only center the horizontal scroll, not the whole page.
      if (window.innerWidth <= 1200) {
          const containerCenter = trendingContainer.offsetWidth / 2;
          const imageCenter = imageToCenter.offsetLeft + imageToCenter.offsetWidth / 2;
          const scrollPosition = imageCenter - containerCenter;
          trendingContainer.scrollLeft = scrollPosition;
      } else {
          // Fallback/Default centering for wide views (though desktop is absolute positioned)
          const containerCenter = trendingContainer.offsetWidth / 2;
          const imageCenter = imageToCenter.offsetLeft + imageToCenter.offsetWidth / 2;
          const scrollPosition = imageCenter - containerCenter;
          trendingContainer.scrollLeft = scrollPosition;
      }
    };

    // Run it once on load
    const initialTimeout = setTimeout(centerTrendingView, 150);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Center the view when the section becomes visible
          centerTrendingView();
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the section is visible
    );

    observer.observe(trendingContainer);

    return () => {
      clearTimeout(initialTimeout);
      observer.disconnect();
    };
  }, []); // Empty dependency array ensures this runs once to set up the observer

  // Video playback logic for trending section
  useEffect(() => {
    const container = trendingContainerRef.current;
    if (!container) return;

    // Target the video elements directly
    const videos = Array.from(container.querySelectorAll('.trending-video'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
            video.play().catch(error => console.log("Autoplay was prevented: ", error));
          } else {
            // Pause and reset video position when it moves out of view
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      {
        root: container,
        threshold: 0.8, // Trigger when 80% of the video is visible
      }
    );

    videos.forEach((video) => observer.observe(video));

    return () => {
      videos.forEach((video) => observer.unobserve(video));
    };
  }, []);
  // Baki ka poora component ka JSX code (return statement) bilkul waisa hi rahega jaisa pehle tha.
  // Humne sirf data fetching logic ko server par move kiya hai.
  // Neeche ka poora return statement aapke purane code se copy kar sakte hain.

  return (
    <>
      <section id="section-hero" className="hero-section">
        {session && (
          <div style={{ position: 'absolute', right: 16, bottom: 16, zIndex: 40 }}>
            <button onClick={() => setIsAddHeroOpen(true)} style={{ padding: '6px 10px' }}>Add Hero Image</button>
          </div>
        )}
        <AnimatePresence>
          <motion.div
            key={currentHeroImage}
            className="hero-bg-image"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            {(heroItems.length > 0 && heroItems[currentHeroImage % heroItems.length]?.imageUrl) || heroImages[currentHeroImage] ? (
              <Image 
                src={heroItems.length > 0 ? heroItems[currentHeroImage % heroItems.length].imageUrl : heroImages[currentHeroImage]} 
                alt={`Hero ${currentHeroImage + 1}`} 
                fill 
                sizes="100vw"
                style={{ objectFit: 'cover' }} 
                priority 
              />
            ) : <div style={{width: '100%', height: '100%', backgroundColor: '#f0f0f0'}}></div> /* Ekdam fallback, jab kuch na ho */ }
          </motion.div>
        </AnimatePresence>
        <div className="hero-dots">
          {(heroItems.length > 0 ? heroItems : heroImages).map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentHeroImage ? 'active' : ''}`}
              onClick={() => setCurrentHeroImage(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Admin hero images management area */}
      {session && (
        <section style={{ padding: 12, borderTop: '1px solid #eee', background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {heroItems.map((h) => (
              <HeroImageCard
                key={h._id}
                item={h}
                onUpdate={(updated) => setHeroItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))}
                onDelete={(id) => setHeroItems((prev) => prev.filter((x) => x._id !== id))}
              />
            ))}
          </div>
        </section>
      )}

      {isAddHeroOpen && (
        <AddHeroModal
          onClose={() => setIsAddHeroOpen(false)}
          onAdd={(newItem) => setHeroItems((prev) => [newItem, ...prev])}
        />
      )}
      
      {/* ... [YAHAN PAR AAPKA BAAKI KA POORA JSX CODE JAISE CELEBRITY SECTION, STORES, ETC. AAYEGA] ... */}
      <div className="page-content-wrapper">
        <CelebritySection />
        <section id="section-featured" className="section-container">
          <div className="featured-header" onClick={() => router.push('/collection')} style={{ cursor: 'pointer' }} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') router.push('/collection'); }}>
            <h2 className="section-title">Featured <span className="highlight">Collection</span></h2>
            <p className="section-subtitle">Handpicked designs that define luxury and elegance</p>
          </div>
          <div ref={featuredContainerRef} className="featured-gallery-wrapper">
             <ImageSlider />
          </div>
        </section>

        {/* --- TRENDING SECTION FIX: Restored absolute positioning via inline styles --- */}
        <section id="section-trending" className="section-container">
          <h2 className="section-title" style={{ cursor: 'pointer' }} onClick={() => router.push('/collection')}>Trending <span className="highlight">Now</span></h2>
          <p className="section-subtitle">Where style meets the spotlight — the moments everyone’s talking about.</p>
          <div ref={trendingContainerRef} className="trending-images-container" style={{ cursor: 'default' }}>
            {/* Background Image */}
              <Image src="/images/background_shape.png" className="trending-bg" alt="background shape" fill sizes="(max-width: 1024px) 100vw, 1200px" style={{ objectFit: 'cover' }} />

              {/* Hidden file input used to replace trending videos (admin only) */}
              {session && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file || replacePosition === null) return;
                    setReplacing(true);
                    try {
                      // Client-side size guard: match server's 150MB limit to avoid sending too-large requests
                      const maxSizeBytes = 150 * 1024 * 1024; // 150MB
                      if (file.size && file.size > maxSizeBytes) {
                        const fileMb = (file.size / (1024 * 1024)).toFixed(1);
                        alert(`Selected file is too large (${fileMb} MB). Maximum allowed is ${maxSizeBytes / (1024 * 1024)} MB.`);
                        setReplacing(false);
                        setReplacePosition(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        return;
                      }

                      const fd = new FormData();
                      fd.append('file', file);

                      // Upload to our server endpoint which forwards to Cloudinary
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      let data = null;
                      if (!res.ok) {
                        // Try to parse server-provided error details
                        try {
                          const errBody = await res.json().catch(() => null);
                          const msg = (errBody && (errBody.error || errBody.message)) || `Upload failed: ${res.status} ${res.statusText}`;
                          throw new Error(msg);
                        } catch (parseErr) {
                          throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
                        }
                      } else {
                        data = await res.json().catch(() => null);
                      }
                      const videoUrl = (data && data.data && data.data.secure_url) || (data && data.data && data.data.secureUrl) || (data && data.data && data.data.url) || null;
                      if (!videoUrl) throw new Error('Upload returned no URL');
                      console.log('Upload result', { videoUrl, raw: data });

                      // Find trending item for the position
                      let item = trendingVideos.find((t) => t.position === replacePosition);

                      if (item) {
                        // Update existing item via API
                        const putRes = await fetch(`/api/trending/${item._id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ videoUrl }),
                        });
                        if (!putRes.ok) throw new Error('Update failed');
                        const putJson = await putRes.json().catch(() => null);
                        const updated = (putJson && putJson.data) || null;
                        if (updated) {
                          setTrendingVideos((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));

                          // Ensure the replaced video element reloads and plays (some browsers show a frame but don't autoplay)
                          setTimeout(() => {
                            try {
                              const el = trendingContainerRef.current?.querySelector(`.pos${replacePosition}.trending-video`);
                              if (el) {
                                el.load();
                                el.play().catch((err) => console.debug('Play prevented:', err));
                              }
                            } catch (err) {
                              console.debug('Error playing replaced trending video', err);
                            }
                          }, 120);
                        }
                      } else {
                        // No item found for this position — create a new trending entry at that position
                        const createRes = await fetch('/api/trending', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ title: '', videoUrl, position: replacePosition }),
                        });
                        if (!createRes.ok) throw new Error('Create failed');
                        const createJson = await createRes.json().catch(() => null);
                        const created = (createJson && createJson.data) || null;
                        if (created) {
                          // Insert created item into state and keep ordering consistent
                          setTrendingVideos((prev) => {
                            // If position duplicates exist, remove them first then insert
                            const filtered = prev.filter((p) => p.position !== created.position);
                            return [...filtered, created].sort((a, b) => (a.position || 0) - (b.position || 0));
                          });

                          // Small delay so the DOM updates, then load & play the new video element
                          setTimeout(() => {
                            try {
                              const el = trendingContainerRef.current?.querySelector(`.pos${replacePosition}.trending-video`);
                              if (el) {
                                el.load();
                                el.play().catch((err) => console.debug('Play prevented:', err));
                              }
                            } catch (err) {
                              console.debug('Error playing created trending video', err);
                            }
                          }, 120);
                        }
                      }
                    } catch (err) {
                      console.error('Replace video error', err);
                      // If server provided a message, show it
                      const serverMessage = err && err.message ? err.message : null;
                      alert(serverMessage ? `Failed to replace video: ${serverMessage}` : 'Failed to replace video. See console for details.');
                    } finally {
                      setReplacing(false);
                      setReplacePosition(null);
                      // clear the input so same file can be picked again if needed
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
              )}

            {/* pos1 (Smallest, furthest left) - Restored positioning styles */}
            <div style={{ position: 'absolute', left: '66px', top: '145px', width: '204px', height: '363px', zIndex: 2 }}>
              <video
                key={(trendingVideos.find(t => t.position === 1)?.videoUrl) || '/images/reel1.mp4'}
                className="trending-video trending-img pos1"
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                src={(trendingVideos.find(t => t.position === 1)?.videoUrl) || '/images/reel1.mp4'}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {session && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: 8, pointerEvents: 'none' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplacePosition(1); fileInputRef.current && fileInputRef.current.click(); }}
                    style={{ pointerEvents: 'auto', marginBottom: 6, zIndex: 20, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {replacing && replacePosition === 1 ? 'Replacing...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>

            {/* pos2 (Medium, inner left) - Restored positioning styles */}
            <div style={{ position: 'absolute', left: '279px', top: '106px', width: '224px', height: '441px', zIndex: 3 }}>
              <video
                key={(trendingVideos.find(t => t.position === 2)?.videoUrl) || '/images/reel2.mp4'}
                className="trending-video trending-img pos2"
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                src={(trendingVideos.find(t => t.position === 2)?.videoUrl) || '/images/reel2.mp4'}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {session && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: 8, pointerEvents: 'none' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplacePosition(2); fileInputRef.current && fileInputRef.current.click(); }}
                    style={{ pointerEvents: 'auto', marginBottom: 6, zIndex: 20, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {replacing && replacePosition === 2 ? 'Replacing...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>

            {/* pos3 (Center, Largest) - Ref and Restored positioning styles */}
            <div style={{ position: 'absolute', left: '512px', top: '67px', width: '245px', height: '527px', zIndex: 4 }}>
              <video
                key={(trendingVideos.find(t => t.position === 3)?.videoUrl) || '/images/reel3.mp4'}
                ref={centerImageRef}
                className="trending-video trending-img pos3 center"
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                src={(trendingVideos.find(t => t.position === 3)?.videoUrl) || '/images/reel3.mp4'}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {session && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: 8, pointerEvents: 'none' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplacePosition(3); fileInputRef.current && fileInputRef.current.click(); }}
                    style={{ pointerEvents: 'auto', marginBottom: 6, zIndex: 20, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {replacing && replacePosition === 3 ? 'Replacing...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>

            {/* pos4 (Medium, inner right) - Restored positioning styles */}
            <div style={{ position: 'absolute', left: '766px', top: '106px', width: '224px', height: '441px', zIndex: 3 }}>
              <video
                key={(trendingVideos.find(t => t.position === 4)?.videoUrl) || '/images/reel4.mp4'}
                className="trending-video trending-img pos4"
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                src={(trendingVideos.find(t => t.position === 4)?.videoUrl) || '/images/reel4.mp4'}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {session && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: 8, pointerEvents: 'none' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplacePosition(4); fileInputRef.current && fileInputRef.current.click(); }}
                    style={{ pointerEvents: 'auto', marginBottom: 6, zIndex: 20, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {replacing && replacePosition === 4 ? 'Replacing...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>

            {/* pos5 (Smallest, furthest right) - Restored positioning styles */}
            <div style={{ position: 'absolute', left: '999px', top: '145px', width: '204px', height: '363px', zIndex: 2 }}>
              <video
                key={(trendingVideos.find(t => t.position === 5)?.videoUrl) || '/images/reel5.mp4'}
                className="trending-video trending-img pos5"
                playsInline
                muted
                loop
                autoPlay
                preload="metadata"
                src={(trendingVideos.find(t => t.position === 5)?.videoUrl) || '/images/reel5.mp4'}
                onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {session && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', padding: 8, pointerEvents: 'none' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setReplacePosition(5); fileInputRef.current && fileInputRef.current.click(); }}
                    style={{ pointerEvents: 'auto', marginBottom: 6, zIndex: 20, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', cursor: 'pointer' }}
                  >
                    {replacing && replacePosition === 5 ? 'Replacing...' : 'Edit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* --- END TRENDING SECTION FIX --- */}

        {/* Admin trending management area - Edit only */}
            {session && null}

        <MultipleOffers />
        <StayClassy />

        <section id="home-stores" className="section-container home-stores">
          <h2 className="section-title">Visit Our <span className="highlight">Stores</span></h2>
          {session && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button onClick={() => setIsAddOpen(true)} style={{ padding: '8px 12px' }}>
                Add Store
              </button>
            </div>
          )}
          <div className="stores-grid">
            {stores.map((store, index) => (
              <StoreCard
                key={store._id}
                store={store}
                index={index}
                onUpdate={(updated) => setStores((prev) => prev.map((s) => (s._id === updated._id ? updated : s)))}
                onDelete={(id) => setStores((prev) => prev.filter((s) => s._id !== id))}
              />
            ))}
          </div>
        </section>

        {isAddOpen && (
          <AddStoreModal
            onClose={() => setIsAddOpen(false)}
            onAdd={(newStore) => setStores((prev) => [newStore, ...prev])}
          />
        )}

        <HowItWorks />

        <section id="section-testimonials" className="section-container">
          <h2 className="section-title">What Our <span className="highlight">Clients Say</span></h2>
          <p className="section-subtitle">Real experiences from our satisfied customers</p>
          <TestimonialsSlider />
        </section>
      </div>
    </>
  );
}