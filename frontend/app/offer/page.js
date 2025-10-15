"use client";
import React, { useEffect, useState, useRef } from 'react';
import './offer.css';
import OfferSignupModal from '../../components/OfferSignupModal';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import EditStoreModal from '../../components/EditStoreModal';
import OfferEditorModal from '../../components/OfferEditorModal';

export default function Offer() {
  const staticStores = [
    { name: 'AMRELI', address: '2nd floor, Shivam plaza, Old, Market Yard Rd, Amreli Irrigation Division, D.L.B. Society, Amreli, Gujarat 365601' },
    { name: 'BOPAL', address: '2nd floor, Nr. TRP Mall BRTS Main Rd, Bopal, Ahmedabad, Gujarat 380058' },
    { name: 'BOTAD', address: '1st & 2nd Floor, Surya Garden Restaurant, Opp:, Paliyad Rd, Botad, Gujarat 364710' },
    { name: 'GOTA', address: '2nd Floor, Block - B, Shlok Infinity, Chandlodiya, Ahmedabad, Gujarat 382481' },
    { name: 'INDORE', address: '1st & 2nd Floor, 8, Footi Kothi Rd, opp. Sethi Gate Road, Gumasta Nagar, Scheme 71, Indore, Madhya Pradesh 452009' },
    { name: 'JAMNAGAR', address: 'Shop No. FF-114, Nandanvan Stylus Complex, Ranjitsagar Rd, Nandanvan Society, Jamnagar, Gujarat 361006' },
    { name: 'JAIPUR', address: 'Plot No. 12, Sarthi Marg, near SBI Choraha, Sector 8, Vaishali Nagar, Jaipur, Rajasthan 302021' },
    { name: 'JETPUR', address: 'Amar Nagar Rd, Dobariya Wadi, Vekariya Nagar, Jetpur, Gujarat 360370' },
    { name: 'KATARGAM', address: 'Shop No.1 to 3, 1st Floor, Bhavya Complex, Laxminarayan Soc Dhabholi Char Rasta, Ved Rd, Katargam, Surat, Gujarat 395004' },
    { name: 'MARUTI CHOWK', address: 'shop no. 1-5, 1floor, panchdev shopping center, Lambe Hanuman Rd, opp. maruti gaushala, Navi Shakti Vijay Society, Panchdev Society, Mohan Nagar, Varachha, Surat, Gujarat 395006' },
    { name: 'MEHSANA', address: 'BHAGWATI CHAMBER, Radhanpur Rd, near BHARAT PETROL PUMP, Dediyasan, Mehsana, Gujarat 384002' },
    { name: 'MORBI', address: '2nd to 4th Floor, Balaji Complex, Shop No, 5-8, Ravapar Rd, opposite Canal Chowk, Morbi, Gujarat 363641' },
    { name: 'NAVSARI', address: '1st floor, Grid Rd, nearby City Tower Apartment, Kachiyawadi, Kaliawadi, Navsari, Gujarat 396427' },
    { name: 'NIKOL', address: 'Nikol Gam Rd, opp. Sardar hawl, prajapati chawl, Indrajit Society, Thakkarbapanagar, Nikol, Ahmedabad, Gujarat 382350' },
    { name: 'RAJKOT', address: 'Opp: Ambika Park, Raiya Rd, Hanuman Madhi Chowk, Before, Rajkot, Gujarat 360007' },
    { name: 'UDAIPUR', address: 'Plot No.8, 100 Feet Rd, opp. Shubh Kesar Garden, New Ashok Vihar, Shobhagpura, Udaipur, Rajasthan 313001' },
    { name: 'YOGICHOWK', address: '2nd Floor and 3rd Floor, Pragati IT World, Shop No. 201 to 208 and 303 to 308, Yogi Chowk Rd, near Satyam Clinic, Yogi Chowk Ground, Punagam, Nana Varachha, Surat, Gujarat 395011' },
  ].sort((a, b) => a.name.localeCompare(b.name));

  const stores = staticStores.map(s => ({
    ...s,
    phone: s.phone || '',
    image: s.image || '/images/stores/store-placeholder.png'
  }));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { data: session } = useSession();
  const [storesData, setStoresData] = useState(stores);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [offersContent, setOffersContent] = useState(null);
  const [offerEditorOpen, setOfferEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const modalIdx = typeof editIdx === 'number' ? editIdx : selectedIdx;
  // Claim toast state
  const [claimToast, setClaimToast] = useState({ show: false, text: '' });
  const toastTimerRef = useRef(null);

  const showClaimToast = (text) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setClaimToast({ show: true, text });
    toastTimerRef.current = setTimeout(() => {
      setClaimToast({ show: false, text: '' });
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleClaim = (e, offer) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const storeName = (storesData[selectedIdx]?.name || stores[selectedIdx]?.name || '').toString();
    const msg = storeName ? `Visit our ${storeName} branch` : 'Visit our branch';
    showClaimToast(msg);
    // You can extend this to call any claim API or analytics here
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Use the public stores API so the Offer page shows the same stores as the homepage "Visit Our Stores"
        const res = await fetch('/api/stores', { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          if (j.success && Array.isArray(j.data)) {
            // sort ascending by name, case-insensitive
            const sorted = j.data.slice().sort((a, b) => {
              const na = (a.name || '').toString().toLowerCase();
              const nb = (b.name || '').toString().toLowerCase();
              return na.localeCompare(nb);
            }).map(s => ({
              ...s,
              phone: s.phone || '',
              image: s.image || '/images/stores/store-placeholder.png'
            }));
            setStoresData(sorted);
          }
        }
      } catch (e) { /* ignore */ }
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
      {/* Claim toast banner (styled via offer.css) */}
      <div className={`claim-toast-container ${claimToast.show ? 'visible' : ''}`} aria-live="polite">
        <div className="claim-toast">
          <div className="claim-toast-text">{claimToast.text}</div>
        </div>
      </div>
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
              <Image
                src={storesData[selectedIdx]?.image || stores[selectedIdx].image}
                alt={`${storesData[selectedIdx]?.name || stores[selectedIdx].name} store interior`}
                width={690}
                height={400}
                className="store-photo"
              />
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
                <h2>{storesData[selectedIdx]?.name || stores[selectedIdx]?.name}</h2>
                {storesData[selectedIdx]?.phone || stores[selectedIdx]?.phone ? (
                  <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>📞 {storesData[selectedIdx]?.phone || stores[selectedIdx]?.phone}</div>
                ) : null}
              </div>
            </div>
            <div className="offers-grid">
              {(() => {
                if (!Array.isArray(offersContent)) return null;
                const hasStoreField = offersContent.some(o => typeof o.store === 'string');
                const selectedStoreName = (storesData[selectedIdx]?.name || stores[selectedIdx]?.name || '').toString().toLowerCase();
                const filteredOffers = hasStoreField ? offersContent.filter(o => (o.store || '').toString().toLowerCase() === selectedStoreName) : offersContent;
                if (filteredOffers.length === 0) {
                  return (
                    <div style={{ padding: 30, textAlign: 'center', width: '100%' }}>
                      <p style={{ fontSize: 18, color: '#666' }}>No offers available for {storesData[selectedIdx]?.name || stores[selectedIdx]?.name} at the moment.</p>
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
                        <Image src={off.image} alt={off.heading} fill sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw" style={{ objectFit: 'fill' }} />
                      </div>
                      {off.discount ? <div className="discount-tag">{off.discount}</div> : null}
                    </div>
                    <div className="offer-card-content">
                      <h3>{off.heading}</h3>
                      <p>{off.subheading}</p>
                      <span className="validity-date">{off.validity}</span>
                      <a href="#" className="claim-button" onClick={(e) => handleClaim(e, off)}>Claim Offer</a>
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