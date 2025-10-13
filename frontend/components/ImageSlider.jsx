// components/ImageSlider.jsx

"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ImageSlider.module.css';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

// images are now fetched from the server (Featured Collection)
import FeaturedImageCard from './FeaturedImageCard';
import AddFeaturedModal from './AddFeaturedModal';
import { useSession } from 'next-auth/react';

const imagesPlaceholder = [
  { src: '/images/offer1.png', alt: 'Image 1' },
  { src: '/images/offer2.png', alt: 'Image 2' },
  { src: '/images/offer3.png', alt: 'Image 3' },
  { src: '/images/offer4.png', alt: 'Image 4' },
  { src: '/images/offer5.png', alt: 'Image 5' },
];

// We'll pick one of these based on viewport size (mobile vs desktop)
const mobileVariants = {
  left: { x: '-70%', scale: 0.8, opacity: 0.6, zIndex: 2 },
  center: { x: '0%', scale: 1, opacity: 1, zIndex: 3 },
  right: { x: '70%', scale: 0.8, opacity: 0.6, zIndex: 2 },
};

const desktopVariants = {
  left: { x: '-95%', scale: 0.8, opacity: 0.8, zIndex: 2 },
  center: { x: '0%', scale: 1, opacity: 1, zIndex: 3 },
  right: { x: '95%', scale: 0.8, opacity: 0.8, zIndex: 2 },
};

const ImageSlider = () => {
  const router = useRouter();
  // YAHAN CHANGE KIYA GAYA HAI (0 se 2)
  const [centerIndex, setCenterIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const [images, setImages] = useState(imagesPlaceholder);
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    // Use a media query to determine mobile vs desktop
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    // fetch featured images
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/featured');
        const json = await res.json().catch(() => null);
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setImages(json.data.map((i) => ({ src: i.src, alt: i.alt || '', _id: i._id })));
        }
      } catch (err) { console.error('Failed to fetch featured images', err); }
    };
    fetchFeatured();
  }, []);

  const goToPrevious = () => {
    setCenterIndex((prevIndex) => (prevIndex - 1 + Math.max(1, images.length)) % Math.max(1, images.length));
  };

  const goToNext = () => {
    setCenterIndex((prevIndex) => (prevIndex + 1) % Math.max(1, images.length));
  };

  const total = images.length;
  const leftIndex = (centerIndex - 1 + total) % Math.max(1, total);
  const rightIndex = (centerIndex + 1) % Math.max(1, total);

  // Sirf 3 images render karenge: left, center, aur right
  const visibleImages = [
    { ...images[leftIndex], position: 'left' },
    { ...images[centerIndex], position: 'center' },
    { ...images[rightIndex], position: 'right' },
  ];

  // Swipe handling
  const pointer = useRef({ startX: 0, startY: 0, isDown: false, moved: false });
  const swipeThreshold = 50; // pixels

  const onPointerDown = (e) => {
    pointer.current.isDown = true;
    pointer.current.moved = false;
  pointer.current.startX = (e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX)) || 0;
  pointer.current.startY = (e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY)) || 0;
  };

  const onPointerMove = (e) => {
    if (!pointer.current.isDown) return;
  const clientX = (e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX)) || 0;
    const dx = clientX - pointer.current.startX;
    if (Math.abs(dx) > 10) pointer.current.moved = true;
  };

  const onPointerUp = (e) => {
    if (!pointer.current.isDown) return;
    pointer.current.isDown = false;
  const clientX = (e.clientX ?? (e.changedTouches && e.changedTouches[0] && e.changedTouches[0].clientX)) || 0;
    const dx = clientX - pointer.current.startX;
    if (Math.abs(dx) >= swipeThreshold) {
      if (dx < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  return (
    <>
    <div className={styles.carouselContainer}>
      <button onClick={goToPrevious} className={`${styles.arrow} ${styles.leftArrow}`}>
        &#10094;
      </button>

      <div
        className={styles.imageWrapper}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        <AnimatePresence>
          {visibleImages.map((image) => (
            <motion.div
              key={image.position} // use stable slot key so elements animate between positions smoothly
              className={styles.imageCard}
              variants={isMobile ? mobileVariants : desktopVariants}
              initial={false} // Initial animation disable karein
              animate={image.position} // 'left', 'center', ya 'right'
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => router.push('/collection')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push('/collection'); }}
              style={{ cursor: 'pointer' }}
            >
              {image.src && (
                <Image
                  src={image.src}
                  alt={image.alt || 'Featured image'}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={styles.image}
                  priority={image.position === 'center'}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button onClick={goToNext} className={`${styles.arrow} ${styles.rightArrow}`}>
        &#10095;
      </button>
      {session && (
        <div style={{ position: 'absolute', right: 132, top: -40 }}>
          <button onClick={() => setIsAddOpen(true)}>Add Featured</button>
        </div>
      )}

      {isAddOpen && (
        <AddFeaturedModal onClose={() => setIsAddOpen(false)} onAdd={(newItem) => setImages((prev) => [{ src: newItem.src, alt: newItem.alt || '', _id: newItem._id }, ...prev])} />
      )}
    </div>
    {session && images && images.length > 0 && (
      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <FeaturedImageCard
            key={img._id || `featured-${idx}`}
            item={{ src: img.src, alt: img.alt, _id: img._id }}
            onUpdate={(u) => setImages((p) => p.map((x) => (x._id === u._id ? { src: u.src, alt: u.alt, _id: u._id } : x)))}
            onDelete={(id) => setImages((p) => p.filter((x) => x._id !== id))}
          />
        ))}
      </div>
    )}
    </>
  );
};

export default ImageSlider;