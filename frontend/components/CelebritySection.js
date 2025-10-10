"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import CelebrityVideoCard from './CelebrityVideoCard';
import AddCelebrityModal from './AddCelebrityModal';

const CelebritySection = () => {
  const [currentVideo, setCurrentVideo] = useState(0);
  const [videos, setVideos] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const videoRef = useRef(null);
  const { data: session } = useSession();
  const isAdmin = !!session;
  const fileInputRef = useRef(null);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/celebrity');
        const json = await res.json().catch(() => null);
        if (json && json.success) setVideos(json.data);
      } catch (err) {
        console.error('Failed to fetch celebrity videos', err);
      }
    };
    fetchVideos();
  }, []);

  const handleVideoEnd = () => {
    setCurrentVideo(prev => (prev + 1) % Math.max(1, videos.length));
  };

  const goToVideo = (index) => {
    setCurrentVideo(index);
  };

  const goToPrevious = () => {
    setCurrentVideo(prev => prev === 0 ? Math.max(0, videos.length - 1) : prev - 1);
  };

  const goToNext = () => {
    setCurrentVideo(prev => (prev + 1) % Math.max(1, videos.length));
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => { console.log("Video play was prevented:", error.name); });
    }
  }, [currentVideo, videos]);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const current = videos[currentVideo];
    if (!current) {
      alert('No video selected to replace');
      e.target.value = '';
      return;
    }
    setReplacing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'yaritu_preset');
      fd.append('folder', 'YARITU');

      const res = await fetch('https://api.cloudinary.com/v1_1/dqjegkdru/video/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const videoUrl = data.secure_url;

      const putRes = await fetch(`/api/celebrity/${current._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      if (!putRes.ok) throw new Error('Update failed');
      const updated = (await putRes.json()).data;
      if (updated) {
        setVideos((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      }
    } catch (err) {
      console.error('Replace video error', err);
      alert('Failed to replace video. See console for details.');
    } finally {
      setReplacing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const current = videos[currentVideo];
    if (!current || !confirm('Delete this video?')) return;
    try {
      const res = await fetch(`/api/celebrity/${current._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const deleted = (await res.json()).data;
      if (deleted) {
        setVideos((prev) => prev.filter((x) => x._id !== deleted._id));
        setCurrentVideo(0);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };


  return (
    <>
      <div className="celebrity-section">
        <div className="section-header">
          <h2 className="section-title">Worn by <span className="highlight">Celebrities</span></h2>
          <p className="section-subtitle">Trusted by the stars for their most important moments</p>
        </div>

        {isAdmin && (
          <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileChange} />
        )}

        <div className="video-carousel-container">
          <button className="video-nav-arrow prev" onClick={goToPrevious} aria-label="Previous video">&#8249;</button>
          
          <div className="video-container">
            {videos.length > 0 ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                key={videos[currentVideo]?._id || 'empty'}
                className="main-video"
              >
                <source src={videos[currentVideo]?.videoUrl || ''} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="no-videos-placeholder">No videos yet</div>
            )}

            {replacing && (
                <div className="replacing-overlay">
                    <div className="spinner"></div>
                    <span>Replacing...</span>
                </div>
            )}

            {isAdmin && videos.length > 0 && (
              <div className="admin-video-controls">
                <button onClick={() => fileInputRef.current?.click()} className="admin-btn" disabled={replacing}>
                  Replace
                </button>
                <button onClick={handleDelete} className="admin-btn delete" disabled={replacing}>
                  Delete
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="admin-add-button-container">
                <button onClick={() => setIsAddOpen(true)} className="admin-btn add-new">
                  + Add Video
                </button>
              </div>
            )}
          </div>
          
          <button className="video-nav-arrow next" onClick={goToNext} aria-label="Next video">&#8250;</button>
        </div>

        <div className="video-dots">
          {Array.from({ length: Math.max(1, videos.length) }).map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentVideo ? 'active' : ''}`}
              onClick={() => goToVideo(index)}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="admin-grid-container">
            {videos.length > 0 ? (
              videos.map((v) => (
                <CelebrityVideoCard
                  key={v._id}
                  item={v}
                  onUpdate={(updated) => setVideos((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))}
                  onDelete={(id) => setVideos((prev) => prev.filter((x) => x._id !== id))}
                />
              ))
            ) : (
              <div className="no-videos-message">No videos yet — use the Add Video button to create one.</div>
            )}
          </div>
        )}

        {isAddOpen && (
          <AddCelebrityModal onClose={() => setIsAddOpen(false)} onAdd={(newItem) => setVideos((prev) => [newItem, ...prev])} />
        )}
      </div>

      <style jsx>{`
        .celebrity-section {
            width: 100%;
            padding: 40px 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .section-header {
            text-align: center;
            margin-bottom: 32px;
        }
        .section-title {
            font-size: 32px;
            font-weight: 700;
            color: #222;
            margin: 0;
        }
        .highlight {
            color: #cfae69; /* Or your brand's accent color */
        }
        .section-subtitle {
            font-size: 18px;
            color: #666;
            margin-top: 8px;
        }
        .video-carousel-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .video-container {
            width: 100%;
            height: 80vh;
            max-height: 720px;
            overflow: hidden;
            border-radius: 16px;
            position: relative;
            background-color: #f0f0f0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .main-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .no-videos-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
            font-size: 18px;
        }
        .replacing-overlay {
            position: absolute;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            z-index: 10;
            font-size: 18px;
            gap: 12px;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-left-color: #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .video-nav-arrow {
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid #ddd;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .video-nav-arrow:hover {
            background: white;
            transform: scale(1.1);
        }
        .video-dots {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 24px;
        }
        .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid #ccc;
            background-color: transparent;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .dot.active {
            background-color: #333;
            border-color: #333;
            transform: scale(1.1);
        }
        
        /* Admin Controls */
        .admin-video-controls {
            position: absolute;
            right: 16px;
            top: 16px;
            z-index: 20;
            display: flex;
            gap: 8px;
        }
        .admin-add-button-container {
            position: absolute;
            right: 16px;
            bottom: 16px;
            z-index: 20;
        }
        .admin-btn {
            padding: 8px 14px;
            border-radius: 8px;
            border: 1px solid rgba(0,0,0,0.1);
            background-color: rgba(255, 255, 255, 0.9);
            color: #333;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        .admin-btn:hover {
            background-color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .admin-btn.delete {
            background-color: #fee2e2;
            color: #b91c1c;
        }
         .admin-btn.delete:hover {
            background-color: #fecaca;
        }
        .admin-btn.add-new {
            background-color: #111;
            color: #fff;
        }
        .admin-btn.add-new:hover {
            background-color: #333;
        }
        
        .admin-grid-container {
            margin-top: 32px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .no-videos-message {
            padding: 20px;
            background: #f5f5f5;
            border-radius: 8px;
            color: #666;
            width: 100%;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .video-nav-arrow { display: none; }
        }
      `}</style>
    </>
  );
};

export default CelebritySection;
