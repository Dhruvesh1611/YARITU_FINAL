"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StoreImageGalleryClient from './StoreImageGalleryClient';
import EditStoreImagesModal from './EditStoreImagesModal';
import styles from '../app/about/about.module.css';

export default function AboutStoresClient() {
  const { data: session } = useSession();
  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStore, setEditingStore] = useState(null);


  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/stores', { cache: 'no-store' });
        const j = await res.json();
        if (!res.ok || !j.success) throw new Error(j.error || j.message || 'Failed to load stores');
        if (isMounted) setStores(Array.isArray(j.data) ? j.data : []);
      } catch (e) {
        console.error(e);
        if (isMounted) setError(e.message || 'Failed to load stores');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const onSaved = (updated) => {
    setStores(prev => prev.map(s => (s._id === updated._id ? updated : s)));
  };

  if (loading) {
    return <div className="container"><p>Loading stores…</p></div>;
  }
  if (error) {
    return <div className="container"><p style={{ color: 'crimson' }}>{error}</p></div>;
  }

  return (
    <div className="container">
      <div className={styles.storesHeader}>
        <h2>Visit Our <span className="highlight">Stores</span></h2>
        <p>Experience our collections firsthand at our premium boutiques</p>
      </div>
     
      <div className={styles.storesGrid}>
        {stores.map((store, index) => {
          const name = store.name || store.city || 'Store';
          const address = store.address || '';
          const phone = store.phone || '';
          const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery || address)}`;
          const images = Array.isArray(store.images) && store.images.length
            ? store.images
            : (store.imageUrl ? [store.imageUrl] : []);
          return (
            <div key={store._id || index} className={`${styles.aboutStoreCard} ${index % 2 !== 0 ? styles.cardReverse : ''}`}>
              <div className={styles.storeDetails}>
                <h3>{name}</h3>
                {address ? <p className={styles.address}>{address}</p> : null}
                {phone ? <p className={styles.phone}>{phone}</p> : null}
                <a href={mapHref} target="_blank" rel="noopener noreferrer" className={styles.storeButton}>Get Directions</a>
                
              </div>
              <a href={mapHref} target="_blank" rel="noopener noreferrer" className={styles.storeImage}>
                <div className={styles.storeImageInner}>
                  <StoreImageGalleryClient images={images} alt={`${name} Store Interior`} />
                </div>
              </a>
            </div>
          );
        })}
      </div>
      {editingStore && (
        <EditStoreImagesModal
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onSaved={(s) => { onSaved(s); setEditingStore(null); }}
        />
      )}
    </div>
  );
}
