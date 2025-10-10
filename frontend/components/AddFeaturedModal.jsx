"use client";
import React, { useState } from 'react';

export default function AddFeaturedModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', alt: '', src: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'yaritu_preset');
      fd.append('folder', 'YARITU');
      const res = await fetch('https://api.cloudinary.com/v1_1/dqjegkdru/image/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm((p) => ({ ...p, src: data.secure_url }));
    } catch (err) { console.error(err); alert('Upload failed'); } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/featured', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Create failed');
      const json = await res.json().catch(() => null);
      const created = (json && json.data) || null;
      if (onAdd && created) onAdd(created);
      onClose();
    } catch (err) { console.error(err); alert('Create failed'); } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: 12, borderRadius: 8, width: 540, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>Add Featured Image</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Alt text</label>
            <input value={form.alt} onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Upload Image</label>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            {uploading && <div>Uploading...</div>}
            {form.src && <img src={form.src} alt="preview" style={{ width: '100%', marginTop: 8 }} />}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving}>{saving ? 'Adding...' : 'Add'}</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
