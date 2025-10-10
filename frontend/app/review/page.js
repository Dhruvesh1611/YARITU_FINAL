"use client";
import React, { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Custom video component for review gallery
function VideoReview({ src, className, isPlaying, onPlay, onStop, thumbnail }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const observerRef = useRef(null);
  
  useEffect(() => {
    if (!isPlaying && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      if (overlayRef.current) overlayRef.current.style.display = 'flex';
    }
  }, [isPlaying]);

  useEffect(() => {
    // Ensure video is not muted
    if (videoRef.current) {
      try { videoRef.current.muted = false; } catch(e) { /* ignore in SSR */ }
    }

    // IntersectionObserver to stop playback when video is mostly out of view
    const node = videoRef.current;
    if (!node) return;

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // If the video is playing but less than 50% visible, stop it
  if (entry.intersectionRatio < 0.5 && isPlaying) {
          // call parent's onPlay to toggle off
          // We cannot call onPlay with an argument here; instead simulate stop by calling a custom stop function if provided
          // We'll dispatch a custom event so parent can listen — but simpler: pause/reset locally and inform overlay.
            try {
              if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
              }
              if (overlayRef.current) overlayRef.current.style.display = 'flex';
              // inform parent to clear playing state
              if (typeof onStop === 'function') onStop();
            } catch (err) {}
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    observerRef.current.observe(node);

    return () => {
      try { observerRef.current && observerRef.current.disconnect(); } catch (e) {}
    };
  }, [isPlaying]);

  const handlePlay = (e) => {
    // Prevent page-level click handlers from firing when user clicks the video
    e.stopPropagation();
    if (videoRef.current) {
      onPlay();
      // Toggle play/pause handled by parent `isPlaying` state. If parent sets isPlaying true, play now.
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      // Attempt to play; if parent toggles to false right after (toggle off), the useEffect will pause/reset
      videoRef.current.play();
    }
  };

  return (
    <div className={className} style={{ position: 'relative', cursor: 'pointer', borderRadius: '16px', overflow: 'hidden' }} onClick={handlePlay}>
      {!isPlaying && thumbnail && (
        <img
          src={thumbnail}
          alt="Video thumbnail"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
        />
      )}
      <video
        ref={videoRef}
        src={src}
        controls={false}
        muted={false}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', background: '#222', zIndex: 2 }}
        controlsList="nodownload noremoteplayback nofullscreen noplaybackrate"
        playsInline
        preload="metadata"
      />
      <div ref={overlayRef} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.25)',
        display: isPlaying ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        pointerEvents: 'none',
      }}>
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#fff" fillOpacity="0.7" /><polygon points="22,18 40,28 22,38" fill="#25384d" /></svg>
      </div>
    </div>
  );
}


export default function Review() {
  const [playingIdx, setPlayingIdx] = useState(null);

  // CHANGE #1: Add a state to track if we are on the client
  const [isClient, setIsClient] = useState(false);

  // CHANGE #2: Use useEffect to set the state to true once the component mounts in the browser
 useEffect(() => {
  console.log("REVIEW PAGE MOUNTED ON CLIENT");
  setIsClient(true);
}, []);

  const { data: session } = useSession();
  // devAdmin is a temporary localStorage toggle to help debugging if your session doesn't expose admin flag yet
  const [devAdmin, setDevAdmin] = useState(false);
  useEffect(() => {
    try {
      setDevAdmin(localStorage.getItem('devAdmin') === '1');
    } catch (e) {}
  }, []);

  useEffect(() => {
    // helpful debug output — remove when done
    console.log('review page session:', session);
  }, [session]);

  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin' || devAdmin);

  // server-backed testimonials
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    if (!isClient) return;
    (async function fetchTestimonials(){
      try {
        const res = await fetch('/api/testimonials');
        const json = await res.json();
        if (json.success) setTestimonials(json.data);
      } catch (err) {
        console.error(err);
      } finally { setLoadingTestimonials(false); }
    })();
  }, [isClient]);

  // modal state for admin add/edit
  const [editing, setEditing] = useState(null); // null | 'new' | testimonial id
  const [form, setForm] = useState({ name: '', quote: '', rating: 5, avatarUrl: '' });
  const [filePreview, setFilePreview] = useState(null);
  const [fileForUpload, setFileForUpload] = useState(null);
  const prevPreviewRef = React.useRef(null);

  const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UNSIGNED_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  // upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
  // Testimonial avatar upload states
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [avatarUploadedUrl, setAvatarUploadedUrl] = useState('');

  // Use XHR to allow progress events for unsigned uploads
  function uploadWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) return reject(new Error('Cloudinary env not set'));
      const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      fd.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);
      fd.append('file', file);

      xhr.open('POST', url);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && typeof onProgress === 'function') {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
      xhr.onload = function () {
        try {
          const res = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(res.secure_url || res.url);
          } else {
            reject(new Error(res.error?.message || 'Upload failed'));
          }
        } catch (err) { reject(err); }
      };
      xhr.onerror = function () { reject(new Error('Network error during upload')); };
      xhr.send(fd);
    });
  }

  async function uploadToCloudinary(file) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) throw new Error('Cloudinary env not set');
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);
    const r = await fetch(url, { method: 'POST', body: formData });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || 'Upload failed');
    return j.secure_url;
  }

  function openNew() {
    // clear any previous preview/url state
    try { if (prevPreviewRef.current) { URL.revokeObjectURL(prevPreviewRef.current); prevPreviewRef.current = null; } } catch (e) {}
    setEditing('new');
    setForm({ name: '', quote: '', rating: 5, avatarUrl: '' });
    setFilePreview(null);
    setFileForUpload(null);
  }

  function openEdit(item) {
    // when editing existing, show the stored avatar but clear file upload buffer
    try { if (prevPreviewRef.current) { URL.revokeObjectURL(prevPreviewRef.current); prevPreviewRef.current = null; } } catch (e) {}
    setEditing(item._id);
    setForm({ name: item.name, quote: item.quote, rating: item.rating || 5, avatarUrl: item.avatarUrl || '' });
    setFilePreview(item.avatarUrl || null);
    setFileForUpload(null);
  }

  async function handleSave() {
    try {
      let avatarUrl = form.avatarUrl;
      // upload the actual File object (if present) not the preview URL string
      if (fileForUpload) {
        setUploadProgress(0);
        setUploadStatusMessage('Starting upload...');
        try {
          // use XHR-enabled upload to show progress
          avatarUrl = await uploadWithProgress(fileForUpload, (p) => {
            setUploadProgress(p);
            setUploadStatusMessage(`Uploading: ${p}%`);
          });
          setUploadStatusMessage('Upload complete');
        } catch (err) {
          console.error('Upload failed', err);
          setUploadStatusMessage('Upload failed: ' + (err.message || ''));
          throw err;
        } finally {
          try { if (prevPreviewRef.current) { URL.revokeObjectURL(prevPreviewRef.current); prevPreviewRef.current = null; } } catch (e) {}
          setFilePreview(null);
          setFileForUpload(null);
        }
      }
      // client-side validation to avoid server 400 for missing fields
      if (!form.name || !form.quote) {
        alert('Please provide both a name and a review before saving.');
        return;
      }

      const payload = { name: form.name, quote: form.quote, rating: form.rating, avatarUrl };
      console.debug('saving testimonial payload:', payload);

      if (editing === 'new') {
        const res = await fetch('/api/testimonials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (!res.ok) {
          console.error('Failed POST /api/testimonials', res.status, j);
          alert(j?.message || j?.error || 'Failed to create testimonial');
          return;
        }
        if (j.success) setTestimonials(prev => [j.data, ...prev]);
      } else {
        const res = await fetch(`/api/testimonials/${editing}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (!res.ok) {
          console.error('Failed PUT /api/testimonials/' + editing, res.status, j);
          alert(j?.message || j?.error || 'Failed to update testimonial');
          return;
        }
        if (j.success) setTestimonials(prev => prev.map(p => p._id === j.data._id ? j.data : p));
      }
      setEditing(null);
    } catch (err) { console.error(err); alert(err.message || 'Save failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) setTestimonials(prev => prev.filter(p => p._id !== id));
    } catch (err) { console.error(err); }
  }

  function handleCancel() {
    try { if (prevPreviewRef.current) { URL.revokeObjectURL(prevPreviewRef.current); prevPreviewRef.current = null; } } catch (e) {}
    setFilePreview(null);
    setFileForUpload(null);
    setEditing(null);
  }
  
  const clientReviews = [
    { id: 1, image: 'https://placehold.co/400x560/EAD9C8/4E3629?text=Client+1', alt: 'Client wearing bridal outfit', text: "The craftsmanship and fabric quality exceeded my expectations. The outfit made my pre-wedding shoot truly memorable!", name: 'Aditi Salvi' },
    { id: 2, image: 'https://placehold.co/400x560/D4E2D4/4E3629?text=Client+2', alt: 'Client couple ethnic', text: "We were new to ethnic styling but the staff guided us patiently. Fit was perfect and styling premium.", name: 'David Santucci' },
    { id: 3, image: 'https://placehold.co/400x560/F5DBC1/4E3629?text=Client+3', alt: 'Bridal portrait', text: "Warm hospitality and elite collection. Every outfit felt unique and expressive.", name: 'Shivani Satpute' },
    { id: 4, image: 'https://placehold.co/400x560/C8DCE5/4E3629?text=Client+4', alt: 'Ethnic twirl pose', text: "Loved the vibrant palette and fall of the fabric. Got so many compliments!", name: 'Samruddhi Bora' },
  ];

  const thumbnails = [
    '/images/Featured1.png',
    '/images/reel2.png',
    '/images/reel3.png',
    '/images/reel4.png',
    '/images/reel5.png',
  ];
  
  // Make the review gallery videos editable in-memory (admin-only). No Add option — only Edit.
  const [videos, setVideos] = useState([
    { src: 'https://yourdomain.com/images/review1.mp4', thumbnail: '/images/Featured1.png' },
    { src: 'https://yourdomain.com/images/review2.mp4', thumbnail: '/images/reel2.png' },
    { src: 'https://yourdomain.com/images/review3.mp4', thumbnail: '/images/reel3.png' },
    { src: 'https://yourdomain.com/images/review4.mp4', thumbnail: '/images/reel4.png' },
    { src: 'https://yourdomain.com/images/review5.mp4', thumbnail: '/images/reel5.png' },
  ]);

  // video edit modal state
  const [editingVideoIndex, setEditingVideoIndex] = useState(null);
  const [videoFilePreview, setVideoFilePreview] = useState(null);
  const [videoFileForUpload, setVideoFileForUpload] = useState(null);
  const [thumbFilePreview, setThumbFilePreview] = useState(null);
  const [thumbFileForUpload, setThumbFileForUpload] = useState(null);
  // immediate-upload states for video modal
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadedUrl, setVideoUploadedUrl] = useState('');
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbUploadProgress, setThumbUploadProgress] = useState(0);
  const [thumbUploadedUrl, setThumbUploadedUrl] = useState('');
  
  return (
    <div id="review-page-wrapper" onClick={() => setPlayingIdx(null)}>
      <style>{`
        /* Global Variables (using CSS variables inside the scoped block) */
        #review-page-wrapper :root {
          --font-heading: 'Garamond', serif;
          --font-body: 'Poppins', sans-serif;
          --color-secondary-text: #666;
          --color-background-light: #fff;
        }
        
        /* 1. Base Styles (Desktop) */
        #review-page-wrapper #reviews {
          position: relative;
          /* Default desktop padding */
          padding-top: 168px; 
          margin-top: -88px; 
          background: linear-gradient(180deg, #ffffff 0%, #f0f0f0 73.85%);
          font-family: var(--font-body);
        }
        
        #review-page-wrapper .reviews-content, 
        #review-page-wrapper .testimonials-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        #review-page-wrapper .reviews-content {
          text-align: center;
        }
        #review-page-wrapper .reviews-title {
          font-family: var(--font-heading);
          font-size: 50px;
          font-weight: 600;
        }
        #review-page-wrapper .reviews-subtitle {
          font-family: var(--font-body);
          font-size: 21px;
          font-weight: 400;
          color: var(--color-secondary-text);
          margin-top: 16px;
        }
        #review-page-wrapper .review-gallery {
          margin-top: 78px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 25px;
          flex-wrap: nowrap;
        }
        #review-page-wrapper .gallery-photo {
          position: relative;
          border-radius: 20px;
          box-shadow: 0px 5px 10px 5px rgba(0, 0, 0, 0.49);
          object-fit: cover;
          transition: transform 0.25s ease, z-index 0.25s ease;
          flex-shrink: 0;
        }
        #review-page-wrapper .gallery-photo:hover {
            transform: translateY(-8px) scale(1.03);
            z-index: 10 !important;
        }
        #review-page-wrapper .photo-1, #review-page-wrapper .photo-5 { width: 212px; height: 310px; }
        #review-page-wrapper .photo-3 { width: 212px; height: 310px; z-index: 5; }
        #review-page-wrapper .photo-2, #review-page-wrapper .photo-4 { width: 244px; height: 387px; }

        #review-page-wrapper #testimonials {
          padding: 80px 0;
          background-color: var(--color-background-light);
          font-family: var(--font-body);
        }
        #review-page-wrapper .testimonials-title {
          text-align: center;
          font-family: var(--font-heading);
          font-size: 48px;
          font-weight: 400;
          margin-bottom: 83px;
        }
        #review-page-wrapper .highlight { color: #c5a46d; }
        
        #review-page-wrapper .review-testimonials-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 29px 20px;
        }

        #review-page-wrapper .testimonial-card {
          border: none;
          border-radius: 20px;
          padding: 0;
          background: transparent;
          transition: transform 0.35s ease, box-shadow 0.35s ease;
          overflow: visible;
        }
        #review-page-wrapper .testimonial-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 12px 32px rgba(0,0,0,0.16);
        }
        #review-page-wrapper .testimonial-card:hover .client-photo { 
            transform: scale(1.04); 
            transition: transform 0.55s ease; 
        }
        #review-page-wrapper .card-content {
          background-color: #fffdf9;
          border: 1px solid #213346;
          border-radius: 18px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        #review-page-wrapper .client-photo-wrap {
          width: 100%;
          overflow: hidden;
          position: relative;
          aspect-ratio: 7 / 10;
          background: #f2f0ed;
        }
        #review-page-wrapper .client-photo {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease;
        }
        #review-page-wrapper .client-review-text {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          line-height: 1.55;
          color: #222;
          margin: 14px 18px 10px;
          letter-spacing: 0.2px;
        }
        #review-page-wrapper .client-signature {
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.4px;
          color: #25384d;
          margin: auto 18px 18px;
          text-transform: uppercase;
        }

        /* 2. Tablet Optimizations (1200px and below) */
        @media (max-width: 1200px) {
          /* Scale down gallery slightly */
          #review-page-wrapper .review-gallery { transform: scale(0.8); transform-origin: top center; }
        }
        
        @media (max-width: 900px) {
          /* Scale down gallery further */
          #review-page-wrapper .review-gallery { transform: scale(0.6); margin-top: 30px; } 
          #review-page-wrapper .review-gallery {
            margin-top: 48px;
          }
        }

        /* 3. Tablet Layout (1024px and below) */
        @media (max-width: 1024px) {
          /* Adjust Review section padding */
          #review-page-wrapper #reviews { 
             padding-top: 120px; /* Reduced padding-top for tablets */
             margin-top: -88px; /* Remove conflicting margin */
          }
          /* Switch testimonials to 2 columns */
          #review-page-wrapper .review-testimonials-grid { grid-template-columns: repeat(2, 1fr); }
          #review-page-wrapper .testimonials-title { font-size: 40px; margin-bottom: 60px; }
        }

        /* 4. Mobile Layout (768px and below) */
        @media (max-width: 768px) {
          /* Re-apply safe padding-top for fixed header on mobile */
          #review-page-wrapper #reviews { 
          #review-page-wrapper .reviews-title { font-size: 30px; }
             padding-top: 160px; /* Safe value for small screens */ 
             margin-top: -88px; /* Remove conflicting margin */
          }
          #review-page-wrapper #testimonials { padding: 60px 0; }
          /* Switch testimonials to 1 column */
          #review-page-wrapper .reviews-title { font-size: 40px; }
          #review-page-wrapper .review-testimonials-grid { grid-template-columns: 1fr; }
          #review-page-wrapper .testimonials-title { font-size: 32px; margin-bottom: 40px; }

          /* Mobile: limit testimonial image height so it doesn't take full viewport */
          #review-page-wrapper .testimonial-card {
            max-width: 520px;
            margin: 0 auto 20px; /* center the single-column card */
          }

          #review-page-wrapper .client-photo-wrap {
            /* reduce aspect ratio and cap height on mobile */
            aspect-ratio: 4 / 5;
            max-height: 360px;
            width: 100%;
            overflow: hidden;
            border-radius: 14px;
          }

          #review-page-wrapper .client-photo {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center;
          }
        }

        /* 5. Small Mobile (600px and below) */
        @media (max-width: 600px) {
          /* Revert gallery from scaling to grid/wrap layout */
          #review-page-wrapper .reviews-title { font-size: 36px; }
          #review-page-wrapper .reviews-subtitle { font-size: 18px; }
          #review-page-wrapper .review-gallery {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            transform: none;
            padding: 0 12px;
            margin-top: 28px;
          }
          #review-page-wrapper .gallery-photo {
            width: 100%;
            height: auto;
            aspect-ratio: 212 / 310;
          }
          #review-page-wrapper .photo-5 {
            grid-column: 1 / -1;
            justify-self: center;
            width: 50%;
          }
        }
      `}</style>

      <section id="reviews">
        <div className="reviews-content">
          <h2 className="reviews-title">Customer <span className="highlight">Reviews</span></h2>
          <p className="reviews-subtitle">Real experiences from our satisfied customers</p>
          
              <div className="review-gallery">
                {videos.map((v, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <VideoReview
                      src={v.src}
                      className={`gallery-photo photo-${idx + 1}`}
                      isPlaying={playingIdx === idx}
                      onPlay={() => setPlayingIdx(prev => (prev === idx ? null : idx))}
                      onStop={() => setPlayingIdx(null)}
                      thumbnail={v.thumbnail}
                    />
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingVideoIndex(idx); setVideoFilePreview(null); setVideoFileForUpload(null); setThumbFilePreview(v.thumbnail || null); setThumbFileForUpload(null); }} style={{ position: 'absolute', top: 8, right: 8, zIndex: 30, padding: '6px 8px' }}>Edit</button>
                    )}
                  </div>
                ))}
              </div>
        </div>
      </section>
      
      <section id="testimonials">
        <div className="testimonials-container">
          <h2 className="testimonials-title">What Our <span className="highlight">Clients Say</span></h2>
          <div className="review-testimonials-grid">
              {/* Render server-backed testimonials on client only */}
              {isClient && (
                loadingTestimonials ? <p>Loading...</p> : testimonials.map((t) => (
                  <div className="testimonial-card" key={t._id}>
                    <div className="card-content">
                      <div className="client-photo-wrap">
                        <img src={t.avatarUrl || 'https://placehold.co/400x560/EAD9C8/4E3629?text=Client'} alt={t.name} className="client-photo" />
                      </div>
                      <p className="client-review-text">{t.quote}</p>
                      <p className="client-signature">~ {t.name}</p>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 8, padding: 12 }}>
                          <button onClick={() => openEdit(t)} style={{ padding: '6px 10px' }}>Edit</button>
                          <button onClick={() => handleDelete(t._id)} style={{ padding: '6px 10px', background: '#b43' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {isAdmin && (
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button onClick={openNew} style={{ padding: '8px 12px' }}>Add Review</button>
              </div>
            )}
            {/* Modal */}
            {editing !== null && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 760 }}>
                  <h3 style={{ marginTop: 0 }}>{editing === 'new' ? 'Add Review' : 'Edit Review'}</h3>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label>Name</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
                      <label>Review</label>
                      <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} style={{ width: '100%', padding: 8, height: 100, marginBottom: 8 }} />
                      <label>Rating</label>
                      <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} style={{ padding: 8 }}>
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div style={{ width: 220 }}>
                      <div style={{ width: 160, height: 160, borderRadius: '50%', background: '#eee', marginBottom: 8, overflow: 'hidden' }}>
                        <img src={avatarUploadedUrl || filePreview || form.avatarUrl || '/images/Rectangle 4.png'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          console.debug('avatar input changed, file:', f);
                          if (!f) return;

                          // immediate visible feedback
                          setUploadStatusMessage('Preparing upload...');

                          // ensure Cloudinary env configured
                          if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UNSIGNED_PRESET) {
                            console.warn('Cloudinary environment variables not set');
                            setUploadStatusMessage('Cloudinary not configured. Set NEXT_PUBLIC_CLOUDINARY_* env vars.');
                            return;
                          }

                          try {
                            // create local preview
                            if (prevPreviewRef.current) { try { URL.revokeObjectURL(prevPreviewRef.current); } catch (err) {} prevPreviewRef.current = null; }
                            const url = URL.createObjectURL(f);
                            prevPreviewRef.current = url;
                            setFilePreview(url);
                            setFileForUpload(null); // we will upload immediately

                            // start immediate upload
                            setAvatarUploading(true);
                            setAvatarUploadProgress(0);
                            setUploadStatusMessage('Uploading avatar...');
                            try {
                              const uploaded = await uploadWithProgress(f, (p) => { setAvatarUploadProgress(p); setUploadStatusMessage(`Uploading avatar: ${p}%`); });
                              setAvatarUploadedUrl(uploaded);
                              setUploadStatusMessage('Avatar uploaded');
                            } catch (err) {
                              console.error('Avatar upload failed', err);
                              setUploadStatusMessage('Avatar upload failed: ' + (err.message || ''));
                              setAvatarUploadedUrl('');
                            } finally {
                              setAvatarUploading(false);
                              setFilePreview(null);
                            }
                          } catch (err) { console.error(err); }
                        }}
                      />

                      {avatarUploading && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ height: 8, width: '100%', background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${avatarUploadProgress}%`, height: '100%', background: '#213346' }} />
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{uploadStatusMessage}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    {uploadStatusMessage && <div style={{ marginBottom: 8 }}>{uploadStatusMessage}</div>}
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div style={{ height: 10, width: '100%', background: '#eee', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#213346' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={handleCancel} style={{ padding: '8px 12px' }}>Cancel</button>
                      <button onClick={handleSave} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none' }}>{editing === 'new' ? 'Add Review' : 'Save'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Video Edit Modal (Admin only) */}
            {editingVideoIndex !== null && isAdmin && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }} onClick={() => setEditingVideoIndex(null)}>
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, width: 760 }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ marginTop: 0 }}>Edit Review Video</h3>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <label>Replace video</label>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ width: '100%', height: 220, background: '#f2f2f2', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {videoFilePreview ? (
                            <video src={videoFilePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                          ) : (
                            <p style={{ color: '#666' }}>No new video selected</p>
                          )}
                        </div>
                        <input type="file" accept="video/*" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          try {
                            const url = URL.createObjectURL(f);
                            setVideoFilePreview(url);
                            setVideoFileForUpload(null); // we'll upload immediately
                            setVideoUploading(true);
                            setVideoUploadProgress(0);
                            setUploadStatusMessage('Uploading video...');
                            try {
                              const uploaded = await uploadWithProgress(f, (p) => { setVideoUploadProgress(p); setUploadStatusMessage(`Uploading video: ${p}%`); });
                              setVideoUploadedUrl(uploaded);
                              setUploadStatusMessage('Video uploaded');
                            } catch (err) {
                              console.error('Video upload failed', err);
                              setUploadStatusMessage('Video upload failed: ' + (err.message || ''));
                              setVideoUploadedUrl('');
                            } finally {
                              setVideoUploading(false);
                              setVideoFileForUpload(null);
                            }
                          } catch (err) { console.error(err); }
                        }} />
                      </div>
                      <label>Replace thumbnail</label>
                      <div style={{ marginBottom: 8 }}>
                        {/* small helper preview for selection area (not the main preview panel) */}
                        <div style={{ width: 160, height: 160, borderRadius: '8px', background: '#eee', overflow: 'hidden' }}>
                          <img src={thumbFilePreview || thumbUploadedUrl || videos[editingVideoIndex]?.thumbnail || '/images/Rectangle 4.png'} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        try {
                          const url = URL.createObjectURL(f);
                          setThumbFilePreview(url);
                          setThumbFileForUpload(null);
                          setThumbUploading(true);
                          setThumbUploadProgress(0);
                          setUploadStatusMessage('Uploading thumbnail...');
                          try {
                            const uploaded = await uploadWithProgress(f, (p) => { setThumbUploadProgress(p); setUploadStatusMessage(`Uploading thumbnail: ${p}%`); });
                            setThumbUploadedUrl(uploaded);
                            setUploadStatusMessage('Thumbnail uploaded');
                          } catch (err) {
                            console.error('Thumbnail upload failed', err);
                            setUploadStatusMessage('Thumbnail upload failed: ' + (err.message || ''));
                            setThumbUploadedUrl('');
                          } finally {
                            setThumbUploading(false);
                            setThumbFileForUpload(null);
                          }
                        } catch (err) { console.error(err); }
                      }} />
                    </div>
                    <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontWeight: 600 }}>Preview</p>
                      {/* Main preview: show either the video OR the thumbnail (not both) depending on what admin selected.
                          Default behaviour: show the video element with poster set to the thumbnail so it resembles the on-page card.
                          If the admin has selected/changed a new video -> show video. Else if admin selected/changed only thumbnail -> show the thumbnail image only. */}
                      {(() => {
                        const hasNewVideo = Boolean(videoUploadedUrl || videoFilePreview);
                        const hasNewThumb = Boolean(thumbUploadedUrl || thumbFilePreview);
                        const displayMode = hasNewVideo ? 'video' : (hasNewThumb ? 'thumb' : 'video');
                        const videoSrc = videoUploadedUrl || videoFilePreview || videos[editingVideoIndex]?.src;
                        const posterSrc = thumbUploadedUrl || thumbFilePreview || videos[editingVideoIndex]?.thumbnail;

                        return (
                          <div style={{ width: '100%', height: 220, background: '#fafafa', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {displayMode === 'video' ? (
                              <video
                                src={videoSrc}
                                poster={posterSrc}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                controls
                                muted
                              />
                            ) : (
                              <img src={posterSrc || '/images/Rectangle 4.png'} alt="thumbnail preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                          </div>
                        );
                      })()}

                      <div style={{ marginTop: 6 }}>
                        <div style={{ marginBottom: 8 }}>{uploadStatusMessage}</div>
                        {(videoUploadProgress > 0 && videoUploadProgress < 100) || (thumbUploadProgress > 0 && thumbUploadProgress < 100) ? (
                          <div>
                            {videoUploadProgress > 0 && videoUploadProgress < 100 && (
                              <div style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 12 }}>Video: {videoUploadProgress}%</div>
                                <div style={{ height: 8, width: '100%', background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                                  <div style={{ width: `${videoUploadProgress}%`, height: '100%', background: '#213346' }} />
                                </div>
                              </div>
                            )}
                            {thumbUploadProgress > 0 && thumbUploadProgress < 100 && (
                              <div>
                                <div style={{ fontSize: 12 }}>Thumbnail: {thumbUploadProgress}%</div>
                                <div style={{ height: 8, width: '100%', background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                                  <div style={{ width: `${thumbUploadProgress}%`, height: '100%', background: '#213346' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                    <button onClick={() => { setEditingVideoIndex(null); }} style={{ padding: '8px 12px' }}>Cancel</button>
                    <button onClick={async () => {
                      // perform uploads (video then thumb) using uploadWithProgress and update local videos array
                      try {
                        let newSrc = videos[editingVideoIndex].src;
                        let newThumb = videos[editingVideoIndex].thumbnail;
                        // if we uploaded already on selection, use those URLs
                        if (videoUploadedUrl) newSrc = videoUploadedUrl;
                        else if (videoFileForUpload) {
                          setUploadProgress(0); setUploadStatusMessage('Uploading video...');
                          newSrc = await uploadWithProgress(videoFileForUpload, (p) => { setUploadProgress(p); setUploadStatusMessage(`Uploading video: ${p}%`); });
                        }
                        if (thumbUploadedUrl) newThumb = thumbUploadedUrl;
                        else if (thumbFileForUpload) {
                          setUploadProgress(0); setUploadStatusMessage('Uploading thumbnail...');
                          newThumb = await uploadWithProgress(thumbFileForUpload, (p) => { setUploadProgress(p); setUploadStatusMessage(`Uploading thumbnail: ${p}%`); });
                        }
                        // update in-memory videos array
                        setVideos(prev => prev.map((it, i) => i === editingVideoIndex ? { ...it, src: newSrc, thumbnail: newThumb } : it));
                        setUploadStatusMessage('Upload complete');
                        setTimeout(() => { setUploadStatusMessage(''); setUploadProgress(0); }, 1200);
                        setEditingVideoIndex(null);
                      } catch (err) {
                        console.error('Video edit upload failed', err);
                        setUploadStatusMessage('Upload failed: ' + (err.message || ''));
                      }
                    }} disabled={videoUploading || thumbUploading} style={{ padding: '8px 12px', background: (videoUploading || thumbUploading) ? '#999' : '#111', color: '#fff', cursor: (videoUploading || thumbUploading) ? 'not-allowed' : 'pointer' }}>Save</button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
