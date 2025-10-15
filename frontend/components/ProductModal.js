"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { WHATSAPP_NUMBER } from '../lib/siteConfig';
import './ProductModal.css'; // CSS file ko link rehne dein

const ProductModal = ({ product, onClose }) => {
  // --- FINAL, BULLETPROOF IMAGE HANDLING LOGIC ---
  let allImageUrls = [];

  // Sabse pehle check karein ki kya 'images' naam ka array hai
  if (Array.isArray(product?.images) && product.images.length > 0) {
    allImageUrls = product.images;
  } 
  // Agar 'images' array nahi hai, to alag-alag properties se gallery banayein
  else {
    allImageUrls = [
      product?.imageUrl || product?.image,
      product?.mainImage2Url,
      ...(Array.isArray(product?.otherImageUrls) ? product.otherImageUrls : [])
    ];
  }

  // Final gallery array, jismein se sabhi empty/null values hata di gayi hain
  const galleryImages = allImageUrls.filter(Boolean);
  
  // Agar koi bhi image nahi milti to ek fallback image use karein
  const finalGallery = galleryImages.length > 0 ? galleryImages : ['/placeholder.png'];

  const [activeImage, setActiveImage] = useState(finalGallery[0]);

  // Effect to set active image and lock body scroll
  useEffect(() => {
    setActiveImage(finalGallery[0]);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [product]); // Sirf product change hone par run hoga

  // Effect for keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (finalGallery.length <= 1) return;

      const currentIndex = finalGallery.indexOf(activeImage);
      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % finalGallery.length;
        setActiveImage(finalGallery[nextIndex]);
      }
      if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + finalGallery.length) % finalGallery.length;
        setActiveImage(finalGallery[prevIndex]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage, finalGallery, onClose]);

  if (!product) return null;

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <div className="product-modal-content">
          <div className="image-gallery">
            <div className="main-image-container">
              {activeImage && (
                <Image
                  key={activeImage}
                  src={activeImage}
                  alt={product.title || product.name || "Product Image"}
                  width={500}
                  height={600}
                  className="main-image"
                  unoptimized
                  onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                />
              )}
            </div>

            {/* Thumbnails ab tabhi dikhenge jab ek se zyada image ho */}
            {finalGallery.length > 1 && (
              <div className="thumbnail-container">
                {finalGallery.map((imgUrl, index) => (
                  <div
                    key={index}
                    className={`thumbnail-item ${imgUrl === activeImage ? 'active' : ''}`}
                    onClick={() => setActiveImage(imgUrl)}
                  >
                    <Image src={imgUrl} alt={`Thumbnail ${index + 1}`} width={100} height={100} unoptimized loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-details">
            {/* ... Product details ka JSX waise hi rahega ... */}
            <h1 className="product-title">{product.title || product.name}</h1>
            <div className="product-meta">
              <span><strong>Category:</strong> {product.category}</span>
              {product.collectionType && <span><strong>Type:</strong> {product.collectionType}</span>}
              {product.occasion && <span><strong>Occasion:</strong> {product.occasion}</span>}
            </div>
            <p className="product-description">{product.description || "Elegant and finely crafted attire..."}</p>
            <div className="price-container">
              {product.discountedPrice && product.discountedPrice > 0 && product.discountedPrice < product.price ? (
                <>
                  <span className="current-price">₹{product.discountedPrice.toLocaleString()}</span>
                  <span className="original-price">₹{product.price.toLocaleString()}</span>
                </>
              ) : (
                // Only show the price when a positive price value exists. If price is undefined, null or 0, render nothing.
                product.price && Number(product.price) > 0 ? (
                  <span className="current-price">₹{Number(product.price).toLocaleString()}</span>
                ) : null
              )}
            </div>
            <button className="rent-now-button" onClick={() => {
              const msg = `Hi, I'm interested in renting "${product.title || product.name}"` +
                `${product.collectionType ? ' - Type: ' + product.collectionType : ''}` +
                `${product.category ? ' - Category: ' + product.category : ''}` +
                `${product._id ? ' - Product ID: ' + product._id : ''}`;
              const encoded = encodeURIComponent(msg);
              const target = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;
              window.open(target, '_blank', 'noopener,noreferrer');
            }}>Rent Now</button>
            <button className="enquire-button" onClick={() => {
              const msg = `Hello, I have a question about "${product.title || product.name}"` +
                `${product.collectionType ? ' - Type: ' + product.collectionType : ''}` +
                `${product.category ? ' - Category: ' + product.category : ''}` +
                `${product._id ? ' - Product ID: ' + product._id : ''}`;
              const encoded = encodeURIComponent(msg);
              const target = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;
              window.open(target, '_blank', 'noopener,noreferrer');
            }}>Enquire on WhatsApp</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;