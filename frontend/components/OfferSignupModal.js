"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function OfferSignupModal({ openAfter = 5000 }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
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
    // Send signup to the new offers endpoint
    fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    }).then(json => {
      console.log('Saved offer signup', json);
      setSubmitted(true); // Show success message
    }).catch(err => {
      console.warn('Offer signup save failed', err);
      // You could add an error message to the user here
    });
  };

  if (!open) return null;

  return (
    <div className="offer-modal-overlay" role="dialog" aria-modal="true" aria-label="Get special deals form">
      <div className="offer-modal-backdrop" onClick={close} />
      <div className="offer-modal offer-modal-two-col">
        <button className="offer-modal-close" onClick={close} aria-label="Close">✕</button>
        <div className="offer-modal-left">
          {/* Left brand image fills the whole left panel */}
          <div className="offer-modal-brand-img">
            <Image
              src="/images/hero3.png"
              alt="Yaritu brand"
              fill
              sizes="(max-width: 880px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
        </div>
  <div className="offer-modal-right" style={{ paddingRight: '36px' }}>
          {/* logo removed from mobile to keep the right column focused on the form */}
          {submitted ? (
            <div className="offer-modal-success">
              <h3>Thank You!</h3>
              <p>Aapko jald hi special deal milegi.</p>
              <button onClick={close} className="offer-modal-submit">Close</button>
            </div>
          ) : (
            <>
              <h3 className="offer-modal-title">Unlock Your Exclusive Offers</h3>
              <p className="offer-modal-sub">Fill in your details to receive personalised deals</p>
              <form className="offer-modal-form" onSubmit={onSubmit}>
                <input ref={firstInputRef} name="name" value={form.name} onChange={onChange} placeholder="Your Name" required />
                <input name="email" value={form.email} onChange={onChange} placeholder="Your Email" type="email" required />
                <div className="offer-modal-phone-wrapper">
                  <span className="phone-prefix">🇮🇳</span>
                  <input name="phone" value={form.phone} onChange={onChange} placeholder="Mobile Number" inputMode="tel" className="phone-input" />
                  <span className="phone-code">+91</span>
                </div>
                <button type="submit" className="offer-modal-submit">GET SPECIAL DEALS</button>
              </form>
              <small className="offer-modal-note">By submitting you agree to our Privacy Policy</small>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
