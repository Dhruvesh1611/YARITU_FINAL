 'use client';
 import React, { useState, useEffect } from 'react';
 import Image from 'next/image';
 import { useRouter } from 'next/navigation';
 import styles from '../app/collection/collection.module.css';

export default function ProductCard({ product, isAdmin, onProductClick, onEdit, onDelete }) {
    const [currentImage, setCurrentImage] = useState(product.mainImage || product.image);
    const router = useRouter();

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

    let imageUrl = null;
    if (typeof currentImage === 'string' && currentImage.length > 0) {
        imageUrl = currentImage;
    } else if (typeof currentImage === 'object' && currentImage?.url) {
        imageUrl = currentImage.url;
    }

    const title = product.title || product.name;
    const description = product.description || '';
    const allImages = [product.mainImage, product.mainImage2, ...(product.otherImages || [])].filter(Boolean);

    return (
        <article className={styles['product-card']}>
            <div className={styles['product-image-wrapper']}>
                {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title || 'Collection item'}
                            className={styles['product-image']}
                            width={300}
                            height={349}
                            unoptimized={true}
                            priority
                            onClick={() => {
                                // Navigate to the collection page and try to open the same category/type section
                                try {
                                    const params = new URLSearchParams();
                                    const normalizedCategory = product.category ? (product.category || '').toString().trim().toUpperCase() : '';
                                    const typeValRaw = product.type || product.collectionType || product.collectionName || '';
                                    const normalizedType = typeValRaw ? typeValRaw.toString().trim().toUpperCase() : '';
                                    const normalizedOccasion = product.occasion ? product.occasion.toString().trim().toUpperCase() : '';

                                    // Write a sessionStorage fallback so the collection page can reliably pick the target
                                    try {
                                        console.log('[DEBUG] ProductCard normalized values:', { normalizedCategory, normalizedType, normalizedOccasion });
                                        if (typeof window !== 'undefined' && (normalizedCategory || normalizedType || normalizedOccasion)) {
                                            sessionStorage.setItem('targetCollection', JSON.stringify({ category: normalizedCategory, type: normalizedType, occasion: normalizedOccasion }));
                                            console.log('[DEBUG] targetCollection written to sessionStorage');
                                        } else {
                                            console.log('[DEBUG] Nothing to write to sessionStorage');
                                        }
                                    } catch (e) {
                                        console.error('[DEBUG] Failed writing sessionStorage', e);
                                    }

                                    if (normalizedCategory) params.set('category', normalizedCategory);
                                    if (normalizedType) params.set('type', normalizedType);
                                    if (normalizedOccasion) params.set('occasion', normalizedOccasion);
                                    const query = params.toString();
                                    router.push(`/collection${query ? `?${query}` : ''}`);
                                } catch (e) {
                                    // fallback: open collection page root
                                    router.push('/collection');
                                }
                            }}
                        />
                ) : (
                    <div className={styles['image-placeholder']}>
                        {/* Placeholder for when there is no image */}
                    </div>
                )}
            </div>
            <div className={styles['card-info']}>
                <p>{title}<br />{description}</p>
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
