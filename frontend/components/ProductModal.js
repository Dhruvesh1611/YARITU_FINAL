"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import './ProductModal.css';

const ProductModal = ({ product, onClose }) => {
  if (!product) {
    return null;
  }
  const FALLBACK_IMAGE = '/images/hero1.png';
  const rawImages = Array.isArray(product.images) && product.images.length
    ? product.images.slice(0, 5)
    : product.image
      ? [product.image]
      : [];
  const images = rawImages.filter(Boolean);
  if (images.length === 0) images.push(FALLBACK_IMAGE);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setActiveIndex(i => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setActiveIndex(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div className="modal-body">
          <div className="modal-image-column">
            <div className="modal-image-container">
              <Image
                src={images[activeIndex]}
                alt={`${product.name} ${activeIndex + 1}`}
                width={400}
                height={500}
                className="modal-image"
                unoptimized
              />
            </div>
            {images.length > 1 && (
              <div className="modal-thumbnails">
                {images.map((img, idx) => (
                  <button key={idx} className={`thumb-btn ${idx === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(idx)}>
                    <Image src={img} alt={`thumb-${idx}`} width={80} height={80} className="thumb-image" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="modal-details">
            <h2>{product.name}</h2>
            <p className="modal-description">{product.description}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Type:</strong> {product.type}</p>
            {product.occasion && <p><strong>Occasion:</strong> {product.occasion}</p>}
            <button className="rent-button">Rent Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
