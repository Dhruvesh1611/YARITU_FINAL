"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import './StayClassy.css';

const collectionImages = [
  '/images/Featured1.png', '/images/Trending1.png', '/images/Featured3.png', '/images/reel2.png', '/images/reel3.png',
  '/images/reel4.png', '/images/reel5.png', '/images/store.png', '/images/offer1.png', '/images/offer2.png',
  '/images/offer3.png', '/images/offer4.png', '/images/offer5.png', '/images/hero1.png', '/images/hero2.png',
  '/images/Featured1.png', '/images/Trending1.png', '/images/Featured3.png', '/images/reel2.png', '/images/reel3.png',
  '/images/reel4.png', '/images/reel5.png', '/images/store.png', '/images/offer1.png', '/images/offer2.png'
];

const StayClassy = () => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const gridRef = useRef(null);
  const { data: session } = useSession();
  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin');
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('stayClassyMetadata');
      if (saved) setMetadata(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to read metadata from localStorage', e);
    }
  }, []);

  // Modal State
  const [editingIndex, setEditingIndex] = useState(null);
  const [category, setCategory] = useState('men');
  const [collectionName, setCollectionName] = useState('Koti');
  const [otherCollection, setOtherCollection] = useState('');
  
  // NEW: State for file handling and upload progress
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const handleFlip = () => setIsFlipped(!isFlipped);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsFlipped(true);
        else setIsFlipped(false);
      },
      { threshold: 0.5 }
    );
    if (gridRef.current) observer.observe(gridRef.current);
    return () => { if (gridRef.current) observer.unobserve(gridRef.current); };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('stayClassyMetadata', JSON.stringify(metadata));
    } catch (e) {
      console.error('Failed to save metadata', e);
    }
  }, [metadata]);

  function openEdit(index) {
    const meta = metadata[index] || {};
    setEditingIndex(index);
    setCategory(meta.category || 'men');
    setCollectionName(meta.collectionName || 'Koti');
    setOtherCollection(meta.otherCollection || '');
    
    // NEW: Reset all file and upload states when opening modal
    setFilePreview(meta.imageUrl || null); // Show existing new image if available
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadError(null);
  }

  function closeEdit() {
    setEditingIndex(null);
  }

  // NEW: Handle file selection from input
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUploadError(null);
    }
  };

  // UPDATED: Save function is now async to handle uploads
  const saveEdit = async () => {
    let newImageUrl = filePreview; // Start with the current preview URL

    // Step 1: Upload the image to Cloudinary IF a new file was selected
    if (selectedFile) {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const url = await uploadToCloudinary(selectedFile, setUploadProgress);
        newImageUrl = url; // On success, update the image URL
      } catch (error) {
        console.error(error);
        setUploadError('Image upload failed. Please try again.');
        setUploading(false);
        return; // Stop the save process if upload fails
      }
      setUploading(false);
    }

    // Step 2: Save the metadata
    const coll = collectionName === 'other' ? (otherCollection || 'other') : collectionName;
    const next = {
      ...metadata,
      [editingIndex]: {
        ...metadata[editingIndex],
        category,
        collectionName: coll,
        otherCollection: collectionName === 'other' ? otherCollection : '',
        imageUrl: newImageUrl, // Save the new Cloudinary URL
      },
    };
    setMetadata(next);
    closeEdit();
  };

  // NEW: Reusable Cloudinary upload function with progress tracking
  const uploadToCloudinary = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'yaritu_preset'); // YOUR UPLOAD PRESET
      formData.append('folder', 'YARITU');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/dqjegkdru/image/upload', true); // YOUR CLOUD NAME

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          onProgress(percentCompleted);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  };

  return (
    <section className="stay-classy-section" ref={gridRef}>
      <h2 className="section-title">
        Stay <span className="highlight">Classy</span>
      </h2>
      <div className="stay-classy-grid">
        {Array.from({ length: 25 }).map((_, index) => {
          const meta = metadata[index] || {};
          const displayImage = meta.imageUrl || collectionImages[index];
          return (
            <div key={index} className="flip-card" style={{ position: 'relative' }}>
              <div
                className={`flip-card-inner ${isFlipped ? 'is-flipped' : ''}`}
                style={{ transitionDelay: `${isFlipped ? index * 0.05 : (24 - index) * 0.05}s` }}
                onClick={() => router.push('/collection')}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push('/collection'); }}
              >
                <div className="flip-card-front"></div>
                <div className="flip-card-back">
                  <Image
                    src={displayImage} // UPDATED to show new image
                    alt={`Collection item ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 20vw, 10vw"
                    style={{ objectFit: 'cover' }}
                  />
                   {meta.category && (
                    <div className="meta-badge" style={{ position: 'absolute', left: 8, bottom: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 12, textTransform: 'capitalize' }}>
                      {meta.category} / {meta.collectionName}
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => openEdit(index)} style={{ position: 'absolute', right: 8, top: 8, zIndex: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}>Edit</button>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={handleFlip} className="flip-button">
        {isFlipped ? 'View Logo' : 'View Collection'}
      </button>

      {/* Redesigned Edit Modal with Upload Progress */}
      {editingIndex !== null && (
        <div className="modalBackdrop" onClick={closeEdit}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Edit Stay Classy Item</h3>
            <div className="modalBody">
              <div className="imageColumn">
                <div className="imagePreview">
                  <img src={filePreview || collectionImages[editingIndex]} alt="preview" />
                </div>
                 <label htmlFor="image-upload" className={`uploadButton ${uploading ? 'disabled' : ''}`}>
                    Choose File
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hiddenFileInput"
                    onChange={handleFileSelect} // UPDATED
                    disabled={uploading}
                  />
                  {/* NEW: Progress Bar and Error Message */}
                  {uploading && (
                     <div className="progressContainer">
                        <div className="progressBar" style={{ width: `${uploadProgress}%` }}>
                           {uploadProgress > 10 && `${uploadProgress}%`}
                        </div>
                     </div>
                  )}
                  {uploadError && <div className="errorMessage">{uploadError}</div>}
              </div>

              <div className="formColumn">
                <div className="formGroup">
                  <label htmlFor="category">Category</label>
                  <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="children">Children</option>
                  </select>
                </div>
                <div className="formGroup">
                  <label htmlFor="collectionName">Collection Name</label>
                  <select id="collectionName" value={collectionName} onChange={(e) => setCollectionName(e.target.value)}>
                    <option value="Koti">Koti</option>
                    <option value="Suit">Suit</option>
                    <option value="Blazer">Blazer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {collectionName === 'other' && (
                  <div className="formGroup">
                    <label htmlFor="otherCollection">Other Collection Name</label>
                    <input
                      id="otherCollection"
                      value={otherCollection}
                      onChange={(e) => setOtherCollection(e.target.value)}
                      placeholder="Enter collection name"
                    />
                  </div>
                )}
                <div className="actionButtons">
                  <button onClick={closeEdit} className="btnCancel" disabled={uploading}>Cancel</button>
                  <button onClick={saveEdit} className="btnSave" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Modal Styles */
        .modalBackdrop {
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex;
            align-items: center; justify-content: center; z-index: 100;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .modalContent {
            background: #ffffff; padding: 24px; border-radius: 12px;
            width: 760px; max-width: 95%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .modalTitle {
            margin: 0 0 20px 0; text-align: center; font-size: 24px; font-weight: 600; color: #333;
        }
        .modalBody { display: flex; gap: 24px; }
        .imageColumn { width: 280px; text-align: center; }
        .imagePreview {
            width: 100%; height: 280px; border-radius: 8px; overflow: hidden;
            background: #f0f0f0; margin-bottom: 12px; border: 2px dashed #ccc;
        }
        .imagePreview img { width: 100%; height: 100%; object-fit: cover; }
        .hiddenFileInput { display: none; }
        .uploadButton {
            display: inline-block; width: 100%; padding: 10px 16px; background-color: #f5f5f5;
            border: 1px solid #ccc; border-radius: 6px; cursor: pointer; transition: background-color 0.2s;
            font-weight: 500;
        }
        .uploadButton.disabled { cursor: not-allowed; background-color: #e0e0e0; opacity: 0.7; }
        .uploadButton:not(.disabled):hover { background-color: #e0e0e0; }
        
        /* NEW: Progress Bar Styles */
        .progressContainer {
            width: 100%; background-color: #e0e0e0; border-radius: 4px;
            margin-top: 12px; height: 20px; overflow: hidden;
        }
        .progressBar {
            height: 100%; background-color: #0070f3; color: white;
            display: flex; align-items: center; justify-content: center;
            font-size: 12px; font-weight: bold;
            transition: width 0.3s ease-in-out;
        }
        .errorMessage { color: #d93025; font-size: 13px; margin-top: 8px; text-align: left; }

        .formColumn { flex: 1; display: flex; flex-direction: column; }
        .formGroup { margin-bottom: 16px; }
        .formGroup label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #444; }
        .formGroup input, .formGroup select {
            width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px;
            font-size: 16px; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .formGroup input:focus, .formGroup select:focus {
            outline: none; border-color: #0070f3; box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
        }
        .actionButtons {
            display: flex; justify-content: flex-end; gap: 12px; margin-top: auto;
            padding-top: 16px; border-top: 1px solid #eee;
        }
        .actionButtons button {
            padding: 10px 20px; font-size: 15px; font-weight: 500; border-radius: 8px;
            border: 1px solid #ccc; cursor: pointer; transition: all 0.2s;
        }
        .btnCancel { background-color: #fff; color: #555; }
        .btnCancel:hover { background-color: #f5f5f5; }
        .btnSave { background-color: #111; color: #fff; border-color: #111; }
        .btnSave:hover { background-color: #333; }
        .actionButtons button:disabled { opacity: 0.6; cursor: not-allowed; }
        
        @media (max-width: 640px) {
            .modalBody { flex-direction: column; }
            .imageColumn { width: 100%; }
            .imagePreview { width: 200px; height: 200px; margin: 0 auto 12px; }
        }
      `}</style>
    </section>
  );
};

export default StayClassy;