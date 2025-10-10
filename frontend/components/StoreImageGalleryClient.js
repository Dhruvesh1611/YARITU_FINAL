"use client";
import React, { useEffect, useState } from 'react';

export default function StoreImageGalleryClient({ images = [], alt = 'Store image', className, style, intervalMs = 1000 }) {
  const validImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (validImages.length <= 1) return; // no rotation if single/empty
    setIdx(0);
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % validImages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [validImages.length, intervalMs]);

  if (validImages.length === 0) {
    // No placeholder per requirement; render empty container with alt text available to ATs
    return <div className={className} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f6f6', color: '#666' }} aria-label={alt} role="img">{alt}</div>;
  }

  const current = validImages[Math.min(idx, validImages.length - 1)];

  return (
    <img src={current} alt={alt} className={className} style={{ ...style, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
  );
}
