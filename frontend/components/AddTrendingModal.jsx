"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AddTrendingModal({ onAdd }) {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!session) return null;

  async function handleUploadAndCreate(e) {
    e.preventDefault();
    if (!file) return alert('Select a video file');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', 'yaritu_preset');
      form.append('folder', 'YARITU');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME}/video/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const secureUrl = data.secure_url || data.secureUrl;
      if (!secureUrl) throw new Error('Cloudinary missing secure_url');

      setUploading(false);
      setCreating(true);
      const createRes = await fetch('/api/trending', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, videoUrl: secureUrl }) });
      if (!createRes.ok) throw new Error('Create failed');
      const json = await createRes.json().catch(() => null);
      if (json && json.data) {
        if (onAdd) onAdd(json.data);
        setShow(false);
        setTitle('');
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      alert('Create failed');
    } finally { setUploading(false); setCreating(false); }
  }

  return (
    <>
      <button onClick={() => setShow(true)}>Add Trending</button>
      {show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 16, borderRadius: 8, width: 520, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>Add Trending Video</h3>
            <form onSubmit={handleUploadAndCreate}>
              <div style={{ marginBottom: 8 }}>
                <label>Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: 8 }} />
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Video File</label>
                <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files && e.target.files[0])} />
                {uploading && <div>Uploading...</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={uploading || creating}>{creating ? 'Creating...' : 'Create'}</button>
                <button type="button" onClick={() => setShow(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
