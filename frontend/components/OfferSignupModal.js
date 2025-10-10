"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function OfferSignupModal({ openAfter = 5000 }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', city: '' });
  const timerRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    // show modal after `openAfter` ms
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, openAfter);

    return () => clearTimeout(timerRef.current);
  }, [openAfter]);

  useEffect(() => {
    if (open && firstInputRef.current) {
      firstInputRef.current.focus();
    }
    // prevent background scroll
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const close = () => setOpen(false);

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    // UI only: store can be sent to backend later. For now just close and log.
    console.log('Sign-up data (UI only):', form);
    // show a thank-you state or close
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="offer-modal-overlay" role="dialog" aria-modal="true" aria-label="Get special deals form">
      <div className="offer-modal-backdrop" onClick={close} />
      <div className="offer-modal offer-modal-two-col">
        <button className="offer-modal-close" onClick={close} aria-label="Close">✕</button>
        <div className="offer-modal-left">
          <div className="offer-modal-logo">
            <Image src="/images/yaritu_logo_white.png" alt="Yaritu logo" width={180} height={80} style={{ objectFit: 'contain', height: 'auto' }} />
          </div>
          {/* Left brand image - replace with your Yaritu branding image */}
          <div className="offer-modal-brand-img">
            <Image
              src="/images/hero3.png"
              alt="Yaritu brand"
              width={380}
              height={520}
              style={{ objectFit: 'cover', borderRadius: 10 }}
              priority
            />
          </div>
        </div>
  <div className="offer-modal-right" style={{ paddingRight: '6px' }}>
          <div className="offer-modal-logo-mobile">
            <Image src="/images/yaritu_logo_white.png" alt="Yaritu logo" width={140} height={60} style={{ objectFit: 'contain', height: 'auto' }} />
          </div>
          <h3 className="offer-modal-title">Unlock Your Exclusive Offers</h3>
          <p className="offer-modal-sub">Fill in your details to receive personalised deals</p>
          <form className="offer-modal-form" onSubmit={onSubmit}>
            <input ref={firstInputRef} name="name" value={form.name} onChange={onChange} placeholder="your name" required />
            <div className="offer-modal-phone-wrapper">
              <span className="phone-prefix">🇮🇳</span>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="Mobile Number" inputMode="tel" required className="phone-input" />
              <span className="phone-code">+91</span>
            </div>
            <input name="city" value={form.city} onChange={onChange} placeholder="City/Area" required />
            <button type="submit" className="offer-modal-submit">GET SPECIAL DEALS</button>
          </form>
          <small className="offer-modal-note">By submitting to agree our Privacy policy</small>
        </div>
      </div>
    </div>
  );
}
