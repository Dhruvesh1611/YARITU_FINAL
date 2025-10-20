"use client";
import React, { useState } from 'react';

export default function AddCelebrityModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', videoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'yaritu_preset');
      fd.append('folder', 'YARITU');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME}/video/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const secureUrl = data.secure_url || data.secureUrl;
      if (!secureUrl) throw new Error('Cloudinary missing secure_url');
      setForm((p) => ({ ...p, videoUrl: secureUrl }));
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/celebrity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Create failed');
      const json = await res.json().catch(() => null);
      const created = (json && json.data) || null;
      if (onAdd && created) onAdd(created);
      onClose();
    } catch (err) {
      console.error(err); alert('Create failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: 16, borderRadius: 8, width: 540, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3>Add Celebrity Video</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} style={{ width: '100%', padding: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Upload Video</label>
            <input type="file" accept="video/*" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <div>Uploading...</div>}
            <div style={{ marginTop: 8 }}>
              <label>Or paste Video URL</label>
              <input value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} style={{ width: '100%', padding: 8 }} />
            </div>
            {form.videoUrl && (
              <div style={{ marginTop: 8 }}>
                <video src={form.videoUrl} controls style={{ width: '100%', maxHeight: 240 }} />
              </div>
            )}
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
