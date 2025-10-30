'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../app/collection/collection.module.css';

export default function ProductCard({ product, isAdmin, onProductClick, onEdit, onDelete, showDescription = true }) {
    const [currentImage, setCurrentImage] = useState(product.thumbnail || product.mainImage || product.image);

    useEffect(() => {
        if (product.mainImage2) {
            const interval = setInterval(() => {
                setCurrentImage(prev => {
                    const firstImage = product.mainImage || product.image;
                    return prev === firstImage ? product.mainImage2 : firstImage;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [product.mainImage, product.mainImage2, product.image]);

    // Ensure currentImage follows product prop updates (so edited images show immediately)
    useEffect(() => {
        const firstImage = product.thumbnail || product.mainImage || product.image || '';
        setCurrentImage(firstImage);
    }, [product.thumbnail, product.mainImage, product.image, product._id, product.id]);

    let imageUrl = null;
    if (typeof currentImage === 'string' && currentImage.length > 0) {
        imageUrl = currentImage;
    } else if (typeof currentImage === 'object' && currentImage?.url) {
        imageUrl = currentImage.url;
    }

    const isPending = !!product.isPending;
    const imagePending = !!product.imagePending;

    const title = product.title || product.name;
    const description = product.description || '';
    const allImages = [product.mainImage, product.mainImage2, ...(product.otherImages || [])].filter(Boolean);

    return (
        <article className={styles['product-card']}>
            <div className={styles['product-image-wrapper']} style={{ position: 'relative' }}>
                {imageUrl ? (
                    <>
                        <Image
                            src={imageUrl}
                            alt={title || 'Collection item'}
                            className={styles['product-image']}
                            width={300}
                            height={349}
                            unoptimized={true}
                            loading="lazy"
                            onClick={() => onProductClick({ ...product, image: imageUrl, name: title, images: allImages })}
                        />
                        {imagePending && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.35)' }}>
                                <svg width="40" height="40" viewBox="0 0 50 50" style={{ display: 'block' }}>
                                    <circle cx="25" cy="25" r="20" stroke="#e6e6e6" strokeWidth="4" fill="none" />
                                    <path d="M45 25a20 20 0 0 1-20 20" stroke="#111" strokeWidth="4" strokeLinecap="round" fill="none">
                                        <animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                                    </path>
                                </svg>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={styles['image-placeholder']}>
                        {/* Placeholder for when there is no image */}
                    </div>
                )}
            </div>
            <div className={styles['card-info']}>
                <p className={styles['card-title']}>{title}</p>
                {/* Price display: show discountedPrice if present and lower than price, otherwise show price */}
                {/* Price display: show current price with 'rent' label and MRP underneath if present */}
                {(() => {
                    // Determine displayed prices
                    const hasDiscount = product.discountedPrice && Number(product.discountedPrice) > 0 && product.price && Number(product.discountedPrice) < Number(product.price);
                    const currentPrice = hasDiscount ? Number(product.discountedPrice) : (product.price ? Number(product.price) : null);

                    // If nothing to show but MRP exists, we'll still render the price container with MRP
                    const shouldRender = currentPrice !== null || product.mrp;
                    if (!shouldRender) return null;

                    return (
                        <div className={styles['price-container']}>
                            <span className={styles['rent-label']}>Rent :</span>
                            {currentPrice !== null ? (
                                <span className={styles['current-price']}>₹{currentPrice.toLocaleString()}</span>
                            ) : (
                                <span className={styles['current-price']}>—</span>
                            )}

                            {/* Original price intentionally hidden on grid; shown only in detailed modal */}

                            {product.mrp ? (
                                <span className={styles['mrp-inline']}>({formatMrp(product.mrp)} MRP)</span>
                            ) : null}
                        </div>
                    );
                })()}
                {showDescription && description ? <p className={styles['card-description']}>{description}</p> : null}
                {isAdmin && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <button onClick={() => onEdit(product)} style={{ padding: '6px 8px' }}>Edit</button>
                        <button onClick={() => onDelete(product)} style={{ padding: '6px 8px', background: '#b91c1c', color: '#fff', border: 'none' }}>Delete</button>
                    </div>
                )}
            </div>
        </article>
    );
}

// small helper to format MRP as '39.0K' when large, else show full rupee format
function formatMrp(value) {
    if (!value && value !== 0) return '';
    const n = Number(value);
    if (isNaN(n)) return value;
    if (Math.abs(n) >= 1000) {
        // show one decimal place in thousands (e.g., 39000 => 39.0K)
        const k = (n / 1000);
        return `${k.toFixed(1)}K`;
    }
    return `₹${n.toLocaleString()}`;
}

// No document-side effects: spinner uses inline SVG animation so server-rendering is safe.
