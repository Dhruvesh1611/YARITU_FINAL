"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './MultipleOffers.css';
import { useSession } from 'next-auth/react';
import EditOfferModal from './EditOfferModal';
import SkeletonLoader from './SkeletonLoader';

const offers = [
  { id: 1, image: '/images/offer1.png', discount: 'UP TO 50% OFF', category: 'HAUL' },
  { id: 2, image: '/images/offer2.png', discount: 'UP TO 40% OFF', category: 'STYLE' },
  { id: 3, image: '/images/offer3.png', discount: 'UP TO 60% OFF', category: 'LIFE' },
  { id: 4, image: '/images/offer4.png', discount: 'UP TO 30% OFF', category: 'FRESH' },
  { id: 5, image: '/images/offer5.png', discount: 'UP TO 70% OFF', category: 'OOTD' },
];

const MultipleOffers = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = !!(session?.user?.role === 'admin' || session?.user?.isAdmin);
  const [offersState, setOffersState] = useState(offers);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % offersState.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch offers from server if an API exists; show skeletons while loading
  useEffect(() => {
    let mounted = true;
    const loadOffers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/offers', { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json().catch(() => null);
          if (j?.success && Array.isArray(j.data) && mounted && j.data.length > 0) {
            setOffersState(j.data);
          }
        }
      } catch (err) {
        // fallback to local offers array
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadOffers();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      try {
        document.querySelectorAll('.offer-card').forEach((c) => c.classList.add('loaded'));
      } catch (err) {}
    }, 80);
    return () => clearTimeout(timer);
  }, [isLoading, offersState]);

  const getCardStyle = (index) => {
    const distance = (index - currentIndex + offers.length) % offers.length;
    const isCentered = distance === 2;

    let transform = '';
    let zIndex = 0;
    let filter = 'grayscale(100%)';

    if (isCentered) {
      // Centered card
      transform = 'translateX(0) scale(1.1)';
      zIndex = 5;
      filter = 'grayscale(0%)';
    } else {
      // Side cards
      const side = distance < 2 ? 'left' : 'right';
      const position = side === 'left' ? 2 - distance : distance - 2;
      const xOffset = position * 60; // Adjust spacing
      const scale = 1 - (position * 0.1);
      transform = `translateX(${side === 'left' ? -xOffset : xOffset}%) scale(${scale})`;
      zIndex = 4 - position;
    }

    return {
      transform,
      zIndex,
      filter,
      transition: 'transform 0.5s ease, filter 0.5s ease',
    };
  };

  const isRemote = (url) => {
    if (!url) return false;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) return true;
      const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '');
      if (cloudName && url.includes(cloudName)) return true;
    } catch (e) {}
    return false;
  };

  return (
    <section className="multiple-offers-section">
      <h2 className="section-title">
        Multiple <span className="highlight">Offers</span>
      </h2>
      <div className="offers-container">
        {offersState.map((offer, index) => (
          <div
            key={offer.id}
            className="offer-card"
            style={{ ...getCardStyle(index), cursor: 'pointer' }}
            onClick={() => router.push('/offer')}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push('/offer'); }}
          >
            {isRemote(offer.image) ? (
              <Image
                src={offer.image}
                alt={`Offer ${offer.id}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="offer-image"
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0 }}>
                <SkeletonLoader variant="video" style={{ width: '100%', height: '100%' }} />
              </div>
            )}
            <div className="offer-details">
              <span className="offer-category">{offer.category}</span>
              <span className="offer-discount">{offer.discount}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Admin small editor boxes */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
          {offersState.map((o, i) => (
            <div key={`edit-${o.id}`} style={{ width: 120, background: '#fff', padding: 8, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', textAlign: 'center' }}>
              {isRemote(o.image) ? (
                <img src={o.image} alt={o.category} style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                <div style={{ width: '100%', height: 72 }}>
                  <SkeletonLoader variant="video" style={{ width: '100%', height: 72, borderRadius: 6 }} />
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{o.category}</div>
              <div style={{ fontSize: 11, color: '#666' }}>{o.discount}</div>
              <button onClick={() => setEditingIndex(i)} style={{ marginTop: 8, padding: '6px 8px', fontSize: 12 }}>Edit</button>
            </div>
          ))}
        </div>
      )}

      {editingIndex !== null && (
        <EditOfferModal
          item={offersState[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSave={(next) => {
            const nextOffers = [...offersState];
            nextOffers[editingIndex] = { ...nextOffers[editingIndex], ...next };
            setOffersState(nextOffers);
            setEditingIndex(null);
          }}
        />
      )}
    </section>
  );
};

export default MultipleOffers;
