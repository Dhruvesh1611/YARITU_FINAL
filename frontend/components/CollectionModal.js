"use client";
import React, { useState, useRef, useEffect } from 'react';

// Main Component
export default function CollectionModal({ initial = null, onClose, onSaved }) {
  // State Hooks
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [category, setCategory] = useState(initial?.category || 'Men');
  const [occasion, setOccasion] = useState(initial?.occasion || '');
  const [collectionType, setCollectionType] = useState(initial?.collectionType || '');
  const [childCategory, setChildCategory] = useState(initial?.childCategory || '');
  
  const [otherOccasionText, setOtherOccasionText] = useState(
    (initial?.occasion && !['Wedding', 'Haldi', 'Reception', 'Sangeet'].includes(initial.occasion)) ? initial.occasion : ''
  );
  const [otherCollectionTypeText, setOtherCollectionTypeText] = useState(
    (initial?.collectionType && !['Sherwani', 'Suit', 'Indo-Western', 'Blazer', 'Sari', 'Lehenga', 'Gown', 'Kurta', 'Frock'].includes(initial.collectionType)) ? initial.collectionType : ''
  );
  
  // State for image previews (URLs)
  const [mainImagePreview, setMainImagePreview] = useState(initial?.imageUrl || '');
  
  // State for the actual file objects
  const [mainImageFile, setMainImageFile] = useState(null);

  const [price, setPrice] = useState(initial?.price || '');
  const [discountedPrice, setDiscountedPrice] = useState(initial?.discountedPrice || '');
  const [status, setStatus] = useState(initial?.status || 'Available');
  const [isFeatured, setIsFeatured] = useState(!!initial?.isFeatured);
  const [tagsText, setTagsText] = useState((initial?.tags || []).join(', '));
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);

  // When a new main image file is selected
  const handleMainFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMainImageFile(file); // Save the actual file
    setMainImagePreview(URL.createObjectURL(file)); // Create a temporary URL for preview
  };

  // Main save function - REBUILT TO USE FormData
  const handleSave = async () => {
    if (!title || (!mainImagePreview && !mainImageFile)) {
      return alert('Title and main image are required');
    }
    setLoading(true);

    // Step 1: Create a FormData object
    const formData = new FormData();

    // Step 2: Append all text fields
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('childCategory', childCategory);
    formData.append('price', Number(price) || 0);
    formData.append('discountedPrice', Number(discountedPrice) || 0);
    formData.append('status', status);
    formData.append('isFeatured', isFeatured);
    formData.append('tags', tagsText); // Send as comma-separated string

    // Handle "Other" fields
    let finalOccasion = occasion;
    if (occasion === 'Other' && otherOccasionText) {
      finalOccasion = otherOccasionText;
      formData.append('newOptions[occasion]', otherOccasionText);
    }
    formData.append('occasion', finalOccasion);
    
    let finalCollectionType = collectionType;
    if (collectionType === 'Other' && otherCollectionTypeText) {
      finalCollectionType = otherCollectionTypeText;
      formData.append('newOptions[collectionType]', otherCollectionTypeText);
    }
    formData.append('collectionType', finalCollectionType);

    // Step 3: Append the image file if it exists
    if (mainImageFile) {
      formData.append('mainImage', mainImageFile);
    } else if (initial?.imageUrl) {
      // If not changing the image, send the old URL to keep it
      formData.append('imageUrl', initial.imageUrl);
    }

    try {
      const editingId = initial?._id || null;
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/collections/${editingId}` : '/api/collections';

      // Step 4: Send the request WITHOUT 'Content-Type' header
      const res = await fetch(url, {
        method: method,
        body: formData, // Send FormData directly
      });

      const j = await res.json();
      if (res.ok && j.success) {
        onSaved?.(j.data);
        onClose?.();
      } else {
        alert(j.error || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  // UI (JSX) remains mostly the same, with minor changes for image preview
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: '#fff', padding: 18, borderRadius: 10, width: 900, maxWidth: '98%', maxHeight: '92vh', overflow: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}>
        <h3 style={{ textAlign: 'center', marginTop: 0 }}>{initial ? 'Edit Collection' : 'Add New Collection'}</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Form Fields (Left Side) */}
          <div style={{ flex: 1 }}>
            <label>Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <label>Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <label>Category</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option>Men</option>
              <option>Women</option>
              <option>Children</option>
            </select>
            {/* Conditional fields based on category */}
            {category === 'Men' && (
              <>
                <label>Occasion</label>
                <select value={occasion} onChange={e=>setOccasion(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
                  <option value="">Select Occasion</option>
                  <option>Wedding</option><option>Haldi</option><option>Reception</option><option>Other</option>
                </select>
                {occasion === 'Other' && <input placeholder="Custom occasion" value={otherOccasionText} onChange={e=>setOtherOccasionText(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />}
                <label>Collection Type</label>
                <select value={collectionType} onChange={e=>setCollectionType(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
                  <option value="">Select Type</option>
                  <option>Sherwani</option><option>Suit</option><option>Indo-Western</option><option>Blazer</option><option>Other</option>
                </select>
                {collectionType === 'Other' && <input placeholder="Custom collection type" value={otherCollectionTypeText} onChange={e=>setOtherCollectionTypeText(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />}
              </>
            )}
            {category === 'Women' && (
              <>
                <label>Occasion</label>
                <select value={occasion} onChange={e => setOccasion(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
                  <option value="">Select Occasion</option>
                  <option>Wedding</option><option>Haldi</option><option>Sangeet</option><option>Other</option>
                </select>
                {occasion === 'Other' && <input placeholder="Custom occasion" value={otherOccasionText} onChange={e => setOtherOccasionText(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />}
                <label>Collection Type</label>
                <select value={collectionType} onChange={e => setCollectionType(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
                  <option value="">Select Type</option>
                  <option>Sari</option><option>Lehenga</option><option>Gown</option><option>Other</option>
                </select>
                {collectionType === 'Other' && <input placeholder="Custom collection type" value={otherCollectionTypeText} onChange={e => setOtherCollectionTypeText(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />}
              </>
            )}
            {/* ... other form fields ... */}
            <label>Price</label>
            <input value={price} onChange={e=>setPrice(e.target.value)} type="number" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <label>Discounted Price</label>
            <input value={discountedPrice} onChange={e=>setDiscountedPrice(e.target.value)} type="number" style={{ width: '100%', padding: 8, marginBottom: 8 }} />
            <label>Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }}>
              <option>Available</option><option>Out of Stock</option>
            </select>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} /> Mark as Featured
            </label>
            <label>Tags (comma separated)</label>
            <input value={tagsText} onChange={e=>setTagsText(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
          </div>
          {/* Image Upload (Right Side) */}
          <div style={{ width: 320 }}>
            <div style={{ marginBottom: 8 }}>
              <label>Main Image *</label>
              <div style={{ width: '100%', height: 200, background: '#f3f3f3', borderRadius: 8, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {mainImagePreview ? <img src={mainImagePreview} alt="main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#999' }}>No image selected</div>}
              </div>
              <div style={{ marginTop: 8 }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMainFileChange} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 24 }}>
              <button type="button" onClick={onClose} style={{ padding: '8px 12px' }}>Cancel</button>
              <button type="button" onClick={handleSave} disabled={loading} style={{ padding: '8px 12px', background: '#111', color: '#fff', border: 'none' }}>
                {loading ? 'Saving...' : (initial ? 'Save Changes' : 'Create Collection')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}