"use client";
import React, { useEffect, useState } from 'react';
import './offer.css';
import OfferSignupModal from '../../components/OfferSignupModal';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import EditStoreModal from '../../components/EditStoreModal';
import OfferEditorModal from '../../components/OfferEditorModal';

export default function Offer() {
  const stores = [
    {
      name: "Udaipur, Rajasthan",
      address: "Plot no 8, 100 Feet Rd, Opp Shubh Kesar Garden, Shobhagpura Udaipur, Rajasthan 313001",
      phone: "+91 99090 00616",
      image: "/images/stores/store1.png"
    },
    {
      name: "Indore",
      address: "1st & 2nd Floor, 8 Gumasta Nagar, Opp. Sethi gate, Footi Kothi Road, Indore, Madhya Pradesh 452009",
      phone: "+91 84016 73773",
      image: "/images/stores/store2.png"
    },
    {
      name: "Jaipur, Rajasthan",
      address: "Plot No. 12, Sec.-8, Sarthi Marg, Near SBI Choraha, Vaishali Nagar, Jaipur, Rajasthan 302021",
      phone: "+91 84016 73273",
      image: "/images/stores/store3.png"
    },
    {
      name: "Jamnagar",
      address: "Shop No. FF-107 to 114, Nandanvan Stylus Complex Nandanvan Society, Ranjit Sagar Road, Jamnagar-361 005",
      phone: "+91 72288 72280",
      image: "/images/stores/store4.png"
    },
    {
      name: "Jetpur",
      address: "1st Floor, Jetpur City Mall, Opp. Gurukrupa Ceramics, Amarnagar Road, Jetpur.",
      phone: "+91 88666 40550",
      image: "/images/stores/store5.png"
    },
    {
      name: "Morbi",
      address: "2nd Floor, Shop No.5-8, 3rd, 4th Floor, Balaji Comp., Opp. Canal Chowk, Ravapar Road, Morbi-363 641",
      phone: "+91 75675 14014",
      image: "/images/stores/store6.png"
    },
    {
      name: "Amreli",
      address: "2nd floor, Shivam Plaza, Near Panchanath Mahadev Temple, Old Marketing Yard, Amreli-365601",
      phone: "+91 88496 68776",
      image: "/images/stores/store7.png"
    },
    {
      name: "Navsari",
      address: "1st Floor, Shreenath House, Near. City Tower, Kaliawadi, Navsari-396427",
      phone: "+91 93287 48970",
      image: "/images/stores/store8.png"
    },
    {
      name: "Nikol, Ahmedabad",
      address: "Opp. Sardar Mall, Nikol Road, Approach Ahmedabad-382350",
      phone: "+91 99099 45508",
      image: "/images/stores/store9.png"
    },
    {
      name: "Gota, Ahmedabad",
      address: "Shop No. 211 to 214, Shlok Infinity, Opp. Vishwakarma Mandir, Nr. Gota Railway Bridge, Chandlodiya, Ahmedabad-382481",
      phone: "+91 97122 05000",
      image: "/images/stores/store10.png"
    },
    {
      name: "Bopal, Ahmedabad",
      address: "Shop No. 2013 to 2018, TRP Mall, Ghuma Road, B.R.T.S. Bopal, Ahmedabad-380058",
      phone: "+91 93166 97344",
      image: "/images/stores/store1.png"
    },
    {
      name: "Maruti Chowk, Surat",
      address: "shop no. 1-5, 1floor, panchdev shopping center, Lambe Hanuman Rd, opp. maruti gaushala, Navi Shakti Vijay Society, Mohan Nagar, Varachha, Surat, Gujarat 395006",
      phone: "+91 89806 14403",
      image: "/images/stores/store2.png"
    },
    {
      name: "Katargam, Surat",
      address: "Shop No.1 to 3, 1st floor, Bhavya Complex, Laxminarayan Soc., Dabholi Char Rasta, Ved Road, Surat.",
      phone: "+91 89806 14400",
      image: "/images/stores/store3.png"
    },
    {
      name: "Yogi Chowk, Surat",
      address: "2nd Floor and 3rd Floor, Pragati IT, World, Yogi Chowk Road, near Satyam Clinic, Punagam, Surat, Gujarat 395010",
      phone: "+91 84016 73473",
      image: "/images/stores/store4.png"
    },
    {
      name: "Rajkot",
      address: "Opp. Ambika Park, Before Hanuman Madhi Chowk, Raiya Road, Rajkot 360007",
      phone: "+91 99090 00615",
      image: "/images/stores/store5.png"
    },
    {
      name: "Mehsana",
      address: "BHAGWATI CHAMBER, NEAR BHARAT PETROL PUMP, Radhanpur Rd, Dediyasan, Mehsana, Gujarat 384002",
      phone: "+91 88667 06069",
      image: "/images/stores/store6.png"
    },
  ];
  const [selectedIdx, setSelectedIdx] = useState(9); // Default to Gota, Ahmedabad
  const { data: session } = useSession();
  const [storesData, setStoresData] = useState(stores);
  const [editOpen, setEditOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [offersContent, setOffersContent] = useState(null);
  const [offerEditorOpen, setOfferEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/stores');
        if (res.ok) {
          const j = await res.json();
          if (j.success && Array.isArray(j.data)) setStoresData(j.data);
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

              {/* Display selected store details */}
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
            store={storesData[editIdx]}
            idx={editIdx}
            onSaved={(updated) => setStoresData((p) => p.map((x, i) => i === editIdx ? updated : x))}
          />
        )}
        <section id="offers" className="offers-section section-padding">
          <div className="page-container">
            <div className="offers-header">
              <Image src="/images/location.png" alt="Location icon" width={50} height={50} />
              <h2>{stores[selectedIdx].name}</h2>
            </div>
            <div className="offers-grid">
              {session && session.user && session.user.role === 'admin' && (
                <div className="admin-add-offer">
                  <button className="admin-add-offer-btn" onClick={() => { setEditingOffer(null); setOfferEditorOpen(true); }}>Add Offer</button>
                </div>
              )}
              {/* If offersContent loaded, show its items; otherwise fall back to static three cards */}
              {Array.isArray(offersContent) ? (
                offersContent.map((off, i) => (
                  <div key={off.id} className={`offer-card ${i === 1 ? 'offset-up' : ''}`}>
                    <div className="offer-card-image">
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4' }}>
                        <Image src={off.image} alt={off.heading} fill sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw" style={{ objectFit: 'contain' }} />
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
                ))
              ) : (
                <>
                  <div className={`offer-card ${0 === 1 ? 'offset-up' : ''}`}>
                    <div className="offer-card-image">
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4' }}>
                        <Image
                          src="/images/shervani.png"
                          alt="Wedding Season Special"
                          fill
                          sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="discount-tag">25% OFF</div>
                    </div>
                    <div className="offer-card-content">
                      <h3>Wedding Season Special</h3>
                      <p>On all bridal lehengas and sherwanis</p>
                      <span className="validity-date">Valid until March 31, 2025</span>
                      <a href="#" className="claim-button">Claim Offer</a>
                    </div>
                  </div>

                  <div className={`offer-card ${1 === 1 ? 'offset-up' : ''}`}>
                    <div className="offer-card-image">
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4' }}>
                        <Image
                          src="/images/image.png"
                          alt="couple combo deal"
                          fill
                          sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="discount-tag">₹2,000/- OFF</div>
                    </div>
                    <div className="offer-card-content">
                      <h3>Couple Combo Deal</h3>
                      <p>When you buy both bride & groom outfits</p>
                      <span className="validity-date">Limited time offer</span>
                      <a href="#" className="claim-button">Claim Offer</a>
                    </div>
                  </div>

                  <div className="offer-card">
                    <div className="offer-card-image">
                      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 4' }}>
                        <Image
                          src="/images/festival.png"
                          alt="festival Collection"
                          fill
                          sizes="(max-width: 600px) 100vw, (max-width: 992px) 50vw, 33vw"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="discount-tag">25% OFF</div>
                    </div>
                    <div className="offer-card-content">
                      <h3>Festival Collection</h3>
                      <p>On ethnic wear for all occasions</p>
                      <span className="validity-date">Ends February 28, 2025</span>
                      <a href="#" className="claim-button">Claim Offer</a>
                    </div>
                  </div>
                </>
              )}
              {offerEditorOpen && (
                <OfferEditorModal
                  open={offerEditorOpen}
                  item={editingOffer}
                  onClose={() => setOfferEditorOpen(false)}
                  onSaved={(saved) => {
                    // update local state
                    setOffersContent((prev) => {
                      if (!Array.isArray(prev)) return [saved];
                      const idx = prev.findIndex(p => p.id === saved.id);
                      if (idx === -1) return [saved, ...prev];
                      const copy = [...prev]; copy[idx] = saved; return copy;
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
          {/* Global WhatsApp button is provided in app/layout.js */}
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

