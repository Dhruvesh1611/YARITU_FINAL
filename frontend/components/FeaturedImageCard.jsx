"use client";
import React, { useState } from 'react';

export default function FeaturedImageCard({ item, onUpdate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: item.title || '', alt: item.alt || '', src: item.src });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/featured/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      const json = await res.json().catch(() => null);
      const updated = (json && json.data) || null;
      if (onUpdate && updated) onUpdate(updated);
      setIsOpen(false);
    } catch (err) { console.error(err); alert('Save failed'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this image?')) return;
    try {
      const res = await fetch(`/api/featured/${item._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const json = await res.json().catch(() => null);
      const deleted = (json && json.data) || null;
      if (onDelete && deleted) onDelete(deleted._id);
    } catch (err) { console.error(err); alert('Delete failed'); }
  };

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

  return (
    <div style={{ width: 220, padding: 8, background: '#fff', borderRadius: 8 }}>
      <div style={{ height: 160, overflow: 'hidden', borderRadius: 8, marginBottom: 8 }}>
        <img src={item.src} alt={item.alt || 'featured'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setIsOpen(true)}>Edit</button>
        <button onClick={handleDelete} style={{ background: '#ff4d4f', color: 'white' }}>Delete</button>
      </div>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 12, borderRadius: 8, width: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>Edit Featured Image</h3>
            <form onSubmit={handleSave}>
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
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit">Save</button>
                <button type="button" onClick={() => setIsOpen(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
