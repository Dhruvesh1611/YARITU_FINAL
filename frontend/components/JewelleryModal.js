"use client";
import React, { useState, useEffect } from 'react';

export default function JewelleryModal({ initial = null, onClose, onSaved, stores = [] }) {
  const isEdit = Boolean(initial && initial._id);
  const [name, setName] = useState(initial?.name || '');
  const [store, setStore] = useState(initial?.store || (stores[0]?.name || ''));
  const [price, setPrice] = useState(initial?.price || '');
  const [discountedPrice, setDiscountedPrice] = useState(initial?.discountedPrice || '');
  const [status, setStatus] = useState(initial?.status || 'Available');
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(initial?.mainImage || '');
  const [otherFiles, setOtherFiles] = useState([]);
  const [otherPreviews, setOtherPreviews] = useState(initial?.otherImages || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      // revoke created blob URLs
      if (mainImagePreview && mainImagePreview.startsWith('blob:')) URL.revokeObjectURL(mainImagePreview);
      otherPreviews.forEach(p => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); });
    };
  }, []);

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (res.ok && j.success && j.data && j.data.secure_url) return j.data.secure_url;
    throw new Error(j.error || 'Upload failed');
  };

  const handleMainImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMainImageFile(f);
    setMainImagePreview(URL.createObjectURL(f));
  };

  const handleOtherChange = (e) => {
    const files = Array.from(e.target.files || []);
    setOtherFiles(prev => [...prev, ...files].slice(0, 5));
    setOtherPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))].slice(0, 5));
  };

  const handleSubmit = async () => {
    if (!name) return alert('Name required');
    setLoading(true);
    try {
      let mainUrl = mainImagePreview;
      if (mainImageFile) mainUrl = await uploadFile(mainImageFile);
      const otherUrls = [];
      for (const f of otherFiles) {
        const u = await uploadFile(f);
        otherUrls.push(u);
      }

      const payload = { name, store, price: Number(price) || 0, discountedPrice: Number(discountedPrice) || 0, status, mainImage: mainUrl, otherImages: otherUrls.length ? otherUrls : otherPreviews };
      const url = isEdit ? '/api/admin/jewellery' : '/api/admin/jewellery';
      const method = isEdit ? 'PUT' : 'POST';
      if (isEdit) payload.id = initial._id;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      const j = await res.json();
      if (res.ok && j.success) {
        onSaved?.(j.data || j);
        onClose?.();
      } else {
        alert(j.error || 'Save failed');
      }
    } catch (e) {
      console.error(e); alert('Upload or save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isEdit ? 'Edit Jewellery' : 'Add New Jewellery'}</h3>
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Store
          <select value={store} onChange={(e) => setStore(e.target.value)}>
            {stores.map(s => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <label>Price<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
        <label>Discounted Price<input type="number" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} /></label>
        <label>Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Available</option>
            <option>Out of Stock</option>
            <option>Coming Soon</option>
          </select>
        </label>
        <label>Main Image<input type="file" accept="image/*" onChange={handleMainImageChange} /></label>
        {mainImagePreview && <img src={mainImagePreview} style={{ width: 120, height: 120, objectFit: 'cover' }} />}
        <label>Other Images<input type="file" accept="image/*" multiple onChange={handleOtherChange} /></label>
        <div style={{ display: 'flex', gap: 8 }}>{otherPreviews.map((p,i) => <img key={i} src={p} style={{ width: 80, height: 80, objectFit: 'cover' }} />)}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
