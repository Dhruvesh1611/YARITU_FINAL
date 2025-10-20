"use client";
import React, { useEffect, useState } from 'react';
import './offer.css';
import OfferSignupModal from '../../components/OfferSignupModal';
import Image from 'next/image';
import isRemote from '../../utils/isRemote';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useSession } from 'next-auth/react';
import EditStoreModal from '../../components/EditStoreModal';
import OfferEditorModal from '../../components/OfferEditorModal';

export default function Offer() {
  // Prefer fetching stores from the public API (same as Home page).
  // Keep a local fallback of `data/stores.json` if the API is unreachable.
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { data: session } = useSession();
  const [storesData, setStoresData] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [offersContent, setOffersContent] = useState(null);
  const [offerEditorOpen, setOfferEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const modalIdx = typeof editIdx === 'number' ? editIdx : selectedIdx;
  const currentStore = storesData[selectedIdx] || storesData[0] || {};

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stores');
        if (res.ok) {
          const j = await res.json();
          if (j.success && Array.isArray(j.data)) return setStoresData(j.data);
        }
      } catch (e) {
        // ignore
      }

      // fallback to local data file if API fails
      try {
        const local = await import('../../data/stores.json');
        if (Array.isArray(local?.default)) setStoresData(local.default);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const res = await fetch('/api/admin/offers-content');
        if (res.ok) {
          const j = await res.json();
          if (j.success && Array.isArray(j.data)) setOffersContent(j.data);
        }
      } catch (e) { /* ignore */ }
    };
    loadOffers();
  }, []);

  return (
    <>
      <OfferSignupModal openAfter={5000} />
      <div className="offer-page">
        <div className="container reviews-content">
          <h2 className="reviews-title"><strong>Exclusive</strong> <span className="highlight">Offers</span></h2>
          <p className="reviews-subtitle">Don't miss out on our limited-time deals and special promotions</p>
        </div>
        <section id="store-selector" className="store-selector-section">
          <div className="store-selector-container">
            <div className="store-selector-content">
              <h2 className="store-selector-title">Choose Your Store</h2>

              <select
                value={selectedIdx}
                onChange={e => setSelectedIdx(Number(e.target.value))}
                className="store-dropdown"
              >
                {storesData.map((store, idx) => (
                  <option value={idx} key={store.name}>{store.name}</option>
                ))}
              </select>

              <div className="selected-store-info">
                <h3>{storesData[selectedIdx]?.name}</h3>
                <p className="store-address">{storesData[selectedIdx]?.address}</p>
                <p className="store-phone">📞 {storesData[selectedIdx]?.phone}</p>
                {session && session.user && session.user.role === 'admin' && (
                  <button onClick={() => { setEditIdx(selectedIdx); setEditOpen(true); }} style={{ marginTop: 8 }}>Edit Store</button>
                )}
              </div>
            </div>
              <div className="store-selector-image">
                <div style={{ width: 575, height: 450 }}>
                  {isRemote(currentStore.imageUrl || currentStore.image) ? (
                    <Image
                      src={currentStore.imageUrl || currentStore.image}
                      alt={`${currentStore.name || 'Store'} store interior`}
                      width={575}
                      height={450}
                      style={{ objectFit: 'cover' }}
                      className="store-photo"
                    />
                  ) : (
                    <SkeletonLoader style={{ width: '100%', height: '100%' }} />
                  )}
                </div>
            </div>
          </div>
        </section>
        {editOpen && (
          <EditStoreModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            store={storesData[modalIdx]}
            idx={modalIdx}
            onSaved={(updated) => setStoresData((p) => p.map((x, i) => i === modalIdx ? updated : x))}
          />
        )}
        <section id="offers" className="offers-section section-padding">
          <div className="page-container">
            <div className="offers-header">
              <Image src="/images/location.png" alt="Location icon" width={50} height={50} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h2>{currentStore.name || ''}</h2>
                {currentStore.phone ? (
                  <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>📞 {currentStore.phone}</div>
                ) : null}
              </div>
            </div>
            <div className="offers-grid">
              {(() => {
                if (!Array.isArray(offersContent)) return null;
                const hasStoreField = offersContent.some(o => typeof o.store === 'string');
                const selectedStoreName = (currentStore.name || '').toString().toLowerCase();
                const filteredOffers = hasStoreField ? offersContent.filter(o => (o.store || '').toString().toLowerCase() === selectedStoreName) : offersContent;
                if (filteredOffers.length === 0) {
                  return (
                    <div style={{ padding: 30, textAlign: 'center', width: '100%' }}>
                      <p style={{ fontSize: 18, color: '#666' }}>No offers available for {currentStore.name || 'this store'} at the moment.</p>
                      {session && session.user && session.user.role === 'admin' && (
                        <p style={{ color: '#333' }}>You can add offers for this store using the Add Offer button.</p>
                      )}
                    </div>
                  );
                }

                return filteredOffers.map((off, i) => (
                  <div key={off.id} className={`offer-card ${i === 1 ? 'offset-up' : ''}`}>
                  <div className="offer-card-image">
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4' }}>
                      {isRemote(off.image) ? (
                        <Image src={off.image} alt={off.heading || 'Offer image'} fill sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw" style={{ objectFit: 'fill' }} />
                      ) : (
                        <SkeletonLoader style={{ width: '100%', height: '100%' }} />
                      )}
                    </div>
                    {off.discount ? <div className="discount-tag">{off.discount}</div> : null}
                  </div>
                    <div className="offer-card-content">
                      <h3>{off.heading}</h3>
                      <p>{off.subheading}</p>
                      <span className="validity-date">{off.validity}</span>
                      <a href="#" className="claim-button">Claim Offer</a>
                      {session && session.user && session.user.role === 'admin' && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => { setEditingOffer(off); setOfferEditorOpen(true); }} style={{ padding: '8px 12px', borderRadius: 6 }}>Edit</button>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
              {session && session.user && session.user.role === 'admin' && (
                <div className="admin-add-offer">
                  <button className="admin-add-offer-btn" onClick={() => { setEditingOffer(null); setOfferEditorOpen(true); }}>Add Offer</button>
                </div>
              )}
              {!Array.isArray(offersContent) && (
                <>
                  {/* Fallback Cards */}
                </>
              )}
              {offerEditorOpen && (
                <OfferEditorModal
                  open={offerEditorOpen}
                  item={editingOffer}
                  storeName={storesData[selectedIdx]?.name}
                  onClose={() => setOfferEditorOpen(false)}
                  
                  // *** YAHAN BADLAV KIYA GAYA HAI ***
                  onSaved={(saved) => {
                    // Manually add the store name to the object returned from the API
                    const newOfferWithStore = {
                      ...saved, // All data from the API response (id, heading, etc.)
                      store: storesData[selectedIdx]?.name, // Add the current selected store name
                    };

                    // Now, update the state with this new, complete object
                    setOffersContent((prev) => {
                      if (!Array.isArray(prev)) return [newOfferWithStore];
                      
                      const idx = prev.findIndex(p => p.id === newOfferWithStore.id);
                      
                      // If it's a new offer, add it to the beginning of the array
                      if (idx === -1) {
                        return [newOfferWithStore, ...prev];
                      }
                      
                      // If it's an existing offer (edit), replace it
                      const copy = [...prev];
                      copy[idx] = newOfferWithStore;
                      return copy;
                    });
                    
                    setOfferEditorOpen(false);
                  }}
                  onDeleted={(deletedId) => {
                    setOffersContent((prev) => Array.isArray(prev) ? prev.filter(x => x.id !== deletedId) : prev);
                  }}
                />
              )}
            </div>
          </div>
        </section>

        <section id="newsletter" className="newsletter-section section-padding">
          <div className="page-container">
            <div className="newsletter-content">
              <h2>Never Miss a Deal</h2>
              <p>Subscribe to our newsletter and get exclusive offers delivered to your inbox</p>
              <form className="subscribe-form">
                <input type="mobile-number" placeholder="Enter your mobile number" />
                <button type="submit">Subscribe</button>
              </form>
              <small>Join 10,000+ happy subscribers and get 10% off your first purchase</small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}