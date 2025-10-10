"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import styles from './TestimonialsSlider.module.css'; // Import the new CSS Module
import AddTestimonialModal from './AddTestimonialModal';
import EditTestimonialModal from './EditTestimonialModal';
import { useSession } from 'next-auth/react';

const TestimonialsSlider = () => {
    const [isPaused, setIsPaused] = useState(false);
    const [items, setItems] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data: session } = useSession();
    const isAdmin = !!session && session.user?.role === 'admin';

    const fetchItems = async () => {
        try {
            const res = await fetch('/api/testimonials');
            const json = await res.json().catch(() => null);
            if (res.ok && json?.success) {
                setItems([...json.data, ...json.data]); // Duplicate for infinite scroll
            } else {
                setItems([]);
            }
        } catch (err) {
            console.error('Failed to load testimonials', err);
            setItems([]);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleAdded = (newItem) => fetchItems();
    const handleUpdated = (updated) => fetchItems();
    const handleDeleted = (deleted) => fetchItems();

    // Get unique items for the admin list (the first half of the duplicated array)
    const uniqueItems = items.slice(0, items.length / 2);

    return (
        <div className={styles.sliderSection}>
            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsAddOpen(true)} className={styles.addButton}>
                        + Add Review
                    </button>
                )}
            </div>

            <div
                className={styles.sliderContainer}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <ClickableTrack 
                    isPaused={isPaused} 
                    items={items} 
                    onCardClick={(t) => { if (isAdmin) setEditing(t); }} 
                />
            </div>

            {isAddOpen && <AddTestimonialModal onClose={() => setIsAddOpen(false)} onAdded={handleAdded} />}
            {editing && <EditTestimonialModal item={editing} onClose={() => setEditing(null)} onUpdated={handleUpdated} onDeleted={handleDeleted} />}

            {/* Admin Management Grid - Redesigned */}
            {isAdmin && uniqueItems.length > 0 && (
                 <div className={styles.adminListWrapper}>
                    <h3 className={styles.adminTitle}>Manage Reviews</h3>
                    <div className={styles.adminList}>
                        <div className={`${styles.adminRow} ${styles.listHeader}`}>
                            <div className={styles.cellUser}>Customer</div>
                            <div className={styles.cellReview}>Review Snippet</div>
                            <div className={styles.cellActions}>Actions</div>
                        </div>

                        {uniqueItems.map((item) => (
                            <div key={item._id || item.id} className={styles.adminRow}>
                                <div className={styles.cellUser}>
                                    <img src={item.avatar || '/images/Rectangle 4.png'} alt={item.name} className={styles.adminAvatar} />
                                    <span>{item.name || '—'}</span>
                                </div>
                                <div className={styles.cellReview}>
                                    <p>{(item.quote?.slice(0, 80)) || '—'}</p>
                                </div>
                                <div className={styles.cellActions}>
                                    <button onClick={() => setEditing(item)} className={styles.editButton}>
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

function ClickableTrack({ isPaused, items, onCardClick }) {
    const trackRef = useRef(null);

    useEffect(() => {
        const track = trackRef.current;
        if (!track || items.length === 0) return;

        const recalc = () => {
            const firstHalfWidth = track.scrollWidth / 2;
            track.style.setProperty('--scroll-width', `${firstHalfWidth}px`);
            const pxPerSec = 40;
            const duration = Math.max(20, firstHalfWidth / pxPerSec);
            track.style.setProperty('--scroll-duration', `${duration}s`);
        };

        // Recalc after images have loaded to get correct width
        let imagesLoaded = 0;
        const images = track.querySelectorAll('img');
        if (images.length === 0) {
            recalc();
        } else {
            images.forEach(img => {
                if (img.complete) {
                    imagesLoaded++;
                } else {
                    img.onload = () => {
                        imagesLoaded++;
                        if (imagesLoaded === images.length) recalc();
                    };
                }
            });
            if (imagesLoaded === images.length) recalc();
        }

        window.addEventListener('resize', recalc);
        return () => window.removeEventListener('resize', recalc);
    }, [items]);

    const trackClass = `${styles.testimonialsTrack} ${isPaused ? styles.paused : ''}`;

    // Use a fallback for when items are not yet loaded
    const displayItems = items.length > 0 ? items : [
        { id: 'f1', avatar: '/images/Rectangle 4.png', name: 'Meera Patel', rating: 5, quote: 'The attention to detail is remarkable.' },
        { id: 'f2', avatar: '/images/Rectangle 4.png', name: 'Rohit Gupta', rating: 5, quote: 'Exceptional quality and service. Highly recommended!' },
        { id: 'f3', avatar: '/images/Rectangle 4.png', name: 'Aisha Sharma', rating: 5, quote: 'Absolutely stunning collection!' },
        // Duplicate fallback items for scrolling effect
        { id: 'f4', avatar: '/images/Rectangle 4.png', name: 'Meera Patel', rating: 5, quote: 'The attention to detail is remarkable.' },
        { id: 'f5', avatar: '/images/Rectangle 4.png', name: 'Rohit Gupta', rating: 5, quote: 'Exceptional quality and service. Highly recommended!' },
        { id: 'f6', avatar: '/images/Rectangle 4.png', name: 'Aisha Sharma', rating: 5, quote: 'Absolutely stunning collection!' },
    ];

    return (
        <div ref={trackRef} className={trackClass}>
            {displayItems.map((item, idx) => (
                <div key={`${item._id || item.id}-${idx}`} className={styles.testimonialsCard} onClick={() => onCardClick(item)}>
                    <div className={styles.cardInner}>
                        <div className={styles.cardTop}>
                            <div className={styles.cardAvatar}>
                                <Image src={item.avatar || '/images/Rectangle 4.png'} alt={`${item.name} avatar`} width={72} height={72} />
                            </div>
                            <div className={styles.cardMeta}>
                                <div className={styles.cardName}>{item.name}</div>
                                <div className={styles.cardStars}>
                                    {Array.from({ length: item.rating || 5 }).map((_, i) => (<span key={i}>★</span>))}
                                </div>
                            </div>
                        </div>
                        <div className={styles.cardQuote}>“{item.quote}”</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default TestimonialsSlider;