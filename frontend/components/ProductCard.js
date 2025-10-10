'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../app/collection/collection.module.css';

export default function ProductCard({ product, isAdmin, onProductClick, onEdit, onDelete }) {
    const [currentImage, setCurrentImage] = useState(product.mainImage || product.image);

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
                        onClick={() => onProductClick({ ...product, image: imageUrl, name: title, images: allImages })}
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
