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
        {/* ... baaki saare sections ... */}
      </div>
    </>
  );
}