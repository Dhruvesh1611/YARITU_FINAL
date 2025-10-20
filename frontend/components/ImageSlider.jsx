"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ImageSlider.module.css';
import { useRouter } from 'next/navigation'; // ✅ YEH LINE ADD KARNI HAI
import AddFeaturedModal from './AddFeaturedModal';
import { useSession } from 'next-auth/react';
import SkeletonLoader from './SkeletonLoader';

// === ICONS (SVG FOR EDIT AND DELETE) ===
const EditIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const DeleteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

// === FEATURED IMAGE CARD COMPONENT (WITH FINAL FIX) ===
const FeaturedImageCard = ({ item, onUpdate, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/featured/${item._id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                onDelete(item._id);
            } else {
                console.error("Failed to delete:", result.error);
                alert("Failed to delete image.");
            }
        } catch (error) {
            console.error("Error during deletion:", error);
            alert("An error occurred.");
        } finally {
            setIsProcessing(false);
            setIsDeleting(false);
        }
    };

    return (
        <div className={styles.featuredCard}>
            {(() => {
                const isRemote = (url) => {
                    if (!url) return false;
                    try {
                        if (url.startsWith('http://') || url.startsWith('https://')) return true;
                        const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '');
                        if (cloudName && url.includes(cloudName)) return true;
                    } catch (e) {}
                    return false;
                };

                if (isRemote(item.src)) {
                    return (
                        <Image
                            src={item.src}
                            alt={item.alt || 'Featured'}
                            width={150}
                            height={150}
                            className={styles.featuredCardImage}
                        />
                    );
                }

                // render placeholder instead of local thumbnail
                return (
                    <div style={{ width: 150, height: 150 }}>
                        <SkeletonLoader variant="video" style={{ width: 150, height: 150 }} />
                    </div>
                );
            })()}
            <div className={styles.cardActionsOverlay}>
                <button className={`${styles.cardActionBtn} ${styles.editBtn}`} onClick={() => onUpdate(item)}>
                    <EditIcon />
                </button>
                <button className={`${styles.cardActionBtn} ${styles.deleteBtn}`} onClick={() => setIsDeleting(true)}>
                    <DeleteIcon />
                </button>
            </div>

            {isDeleting && (
                <div className={styles.confirmDeleteOverlay} onClick={() => setIsDeleting(false)}>
                    <div className={styles.confirmDeleteModal} onClick={(e) => e.stopPropagation()}>
                        <h4>Confirm Deletion</h4>
                        <p>Are you sure you want to delete this image?</p>
                        <div>
                            <button onClick={() => setIsDeleting(false)} disabled={isProcessing}>Cancel</button>
                            <button onClick={handleDelete} className={styles.confirmBtn} disabled={isProcessing}>
                                {isProcessing ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// === MAIN IMAGE SLIDER COMPONENT (WITH HOOKS FIX) ===
const imagesPlaceholder = [
    { src: '/images/offer1.png', alt: 'Image 1' }, { src: '/images/offer2.png', alt: 'Image 2' },
    { src: '/images/offer3.png', alt: 'Image 3' }, { src: '/images/offer4.png', alt: 'Image 4' },
    { src: '/images/offer5.png', alt: 'Image 5' },
];

const mobileVariants = {
    left: { x: '-50%', scale: 0.8, opacity: 0.6, zIndex: 2 },
    center: { x: '0%', scale: 1, opacity: 1, zIndex: 3 },
    right: { x: '50%', scale: 0.8, opacity: 0.6, zIndex: 2 },
};

const desktopVariants = {
    left: { x: '-95%', scale: 0.8, opacity: 0.8, zIndex: 2 },
    center: { x: '0%', scale: 1, opacity: 1, zIndex: 3 },
    right: { x: '95%', scale: 0.8, opacity: 0.8, zIndex: 2 },
};

const ImageSlider = () => {
    const router = useRouter();
    const [centerIndex, setCenterIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const { data: session } = useSession();
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const pointer = useRef({ startX: 0, startY: 0, isDown: false, moved: false });

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                const res = await fetch('/api/featured');
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    setImages(json.data);
                } else {
                    setImages(imagesPlaceholder);
                }
            } catch (err) {
                console.error('Failed to fetch featured images', err);
                setImages(imagesPlaceholder);
            } finally {
                setCenterIndex(0);
                setIsLoading(false);
            }
        };
        fetchFeatured();
    }, []);
    
    const goToPrevious = useCallback(() => {
        if (images.length === 0) return;
        setCenterIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const goToNext = useCallback(() => {
        if (images.length === 0) return;
        setCenterIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handleUpdate = useCallback((item) => {
        setCurrentItem(item);
        setIsEditOpen(true);
    }, []);

    const handleDelete = useCallback((idToDelete) => {
        setImages((prev) => prev.filter((image) => image._id !== idToDelete));
    }, []);

    const handleAdd = useCallback((newItem) => {
        setImages((prev) => [newItem, ...prev]);
        setCenterIndex(0);
    }, []);

    const handleUpdateInList = useCallback((updatedItem) => {
        setImages((p) => p.map((x) => (x._id === updatedItem._id ? updatedItem : x)));
    }, []);

    if (images.length === 0 && !isLoading) {
        return null;
    }

    const total = images.length;
    const leftIndex = (centerIndex - 1 + total) % total;
    const rightIndex = (centerIndex + 1) % total;

    const visibleImages = [
        { ...images[leftIndex], position: 'left' },
        { ...images[centerIndex], position: 'center' },
        { ...images[rightIndex], position: 'right' },
    ];
    
    const onPointerDown = (e) => {
        pointer.current.isDown = true;
        pointer.current.moved = false;
        pointer.current.startX = (e.clientX ?? e.touches?.[0]?.clientX) || 0;
        pointer.current.startY = (e.clientY ?? e.touches?.[0]?.clientY) || 0;
    };

    const onPointerMove = (e) => {
        if (!pointer.current.isDown) return;
        const clientX = (e.clientX ?? e.touches?.[0]?.clientX) || 0;
        if (Math.abs(clientX - pointer.current.startX) > 10) pointer.current.moved = true;
    };

    const onPointerUp = (e) => {
        if (!pointer.current.isDown) return;
        pointer.current.isDown = false;
        const clientX = (e.clientX ?? e.changedTouches?.[0]?.clientX) || 0;
        const dx = clientX - pointer.current.startX;
        const swipeThreshold = 50;
        if (Math.abs(dx) >= swipeThreshold) {
            if (dx < 0) goToNext();
            else goToPrevious();
        }
    };
    
    return (
        <>
            <div className={styles.carouselContainer}>
                {session && (
                    <div className={styles.addFeaturedContainer}>
                        <button onClick={() => setIsAddOpen(true)} className={styles.addFeaturedBtn}>
                            + Add New
                        </button>
                    </div>
                )}
                <button onClick={goToPrevious} className={`${styles.arrow} ${styles.leftArrow}`}>&#10094;</button>
                <div
                    className={styles.imageWrapper}
                    onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
                    onTouchStart={onPointerDown} onTouchMove={onPointerMove} onTouchEnd={onPointerUp}
                >
                    <AnimatePresence>
                            {visibleImages.map((image) => (
                                 <motion.div
                                    key={image._id ? image._id + image.position : image.src + image.position}
                                    className={`${styles.imageCard} ${isLoading ? 'initHidden' : ''}`}
                                    variants={isMobile ? mobileVariants : desktopVariants}
                                    initial={false}
                                    animate={image.position}
                                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                                    onClick={() => router.push('/collection')}
                                    role="link" tabIndex={0}
                                >
                                    {isLoading ? (
                                        <SkeletonLoader variant="video" style={{ width: '100%', height: '100%' }} />
                                    ) : (
                                        <Image
                                            src={image.src} alt={image.alt || 'Featured image'} fill
                                            sizes="(max-width: 768px) 70vw, 22vw"
                                            className={styles.image}
                                            priority={image.position === 'center'}
                                            onLoadingComplete={(img) => {
                                                try { img.classList.add('loaded'); } catch (err) {}
                                                try { const parent = img.closest(`.${styles.imageCard}`); if (parent) parent.classList.add('loaded'); } catch (err) {}
                                            }}
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                </div>
                <button onClick={goToNext} className={`${styles.arrow} ${styles.rightArrow}`}>&#10095;</button>
            </div>

            {isAddOpen && <AddFeaturedModal onClose={() => setIsAddOpen(false)} onAdd={handleAdd} />}
            {isEditOpen && currentItem && (
                <AddFeaturedModal
                    isEditing={true}
                    item={currentItem}
                    onClose={() => { setIsEditOpen(false); setCurrentItem(null); }}
                    onUpdate={handleUpdateInList}
                />
            )}

            {session && images.length > 0 && (
                <div className={styles.featuredGrid}>
                    {images.map((img) => (
                        <FeaturedImageCard
                            key={img._id || img.src}
                            item={img}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default ImageSlider;