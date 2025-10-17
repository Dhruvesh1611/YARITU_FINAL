"use client";
import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CelebrityVideoCard({ item, onUpdate, onDelete }) {
  const { data: session } = useSession();
  const isAdmin = !!session;
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ title: item.title || '', videoUrl: item.videoUrl, visibility: item.visibility || 'both' });
  
  // State for async operations
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const secureUrl = await uploadToCloudinary(file, setUploadProgress);
      setForm((p) => ({ ...p, videoUrl: secureUrl }));
    } catch (err) {
      console.error(err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const uploadToCloudinary = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'yaritu_preset');
      formData.append('folder', 'YARITU');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://api.cloudinary.com/v1_1/dqjegkdru/video/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  };


  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/celebrity/${item._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Save failed');
      const updated = (await res.json()).data;
      if (onUpdate) onUpdate(updated);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      alert('Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this video?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/celebrity/${item._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const deleted = (await res.json()).data;
      if (onDelete) onDelete(deleted._id);
      setIsOpen(false);
    } catch (err) { console.error(err); alert('Delete failed'); } finally { setDeleting(false); }
  };

  return (
    <>
      <div className="video-card">
        <div className="video-thumbnail">
          <video src={item.videoUrl} muted loop playsInline />
        </div>
        <div className="card-footer">
            <p className="card-title">{item.title || 'Untitled'}</p>
            {isAdmin && (
                <div className="card-actions">
                    <button onClick={() => setIsOpen(true)} className="action-btn edit-btn">Edit</button>
                    <button onClick={handleDelete} className="action-btn delete-btn" disabled={deleting}>
                        {deleting ? '...' : 'Del'}
                    </button>
                </div>
            )}
        </div>
      </div>

      {isOpen && isAdmin && (
        <div className="modalBackdrop" onClick={() => setIsOpen(false)}>
          <div className="modalContent" onClick={(e) => e.stopPropagation()}>
            <h3 className="modalTitle">Edit Celebrity Video</h3>
            <form onSubmit={handleSave}>
              <div className="formGroup">
                <label htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              
              <div className="formGroup">
                <label>Video</label>
                 <div className="videoPreview">
                    {form.videoUrl ? <video src={form.videoUrl} controls /> : <span>No video selected</span>}
                 </div>
              </div>

               <div className="formGroup">
                <label htmlFor="video-upload" className={`uploadButton ${uploading ? 'disabled' : ''}`}>
                    Upload New Video
                </label>
                <input id="video-upload" type="file" accept="video/*" className="hiddenFileInput" onChange={handleFileUpload} disabled={uploading} />
                 {uploading && (
                  <div className="progressContainer">
                    <div className="progressBar" style={{ width: `${uploadProgress}%` }}>
                      {uploadProgress > 10 && `${uploadProgress}%`}
                    </div>
                  </div>
                )}
                {uploadError && <div className="errorMessage">{uploadError}</div>}
              </div>

              <div className="formGroup">
                <label htmlFor="videoUrl">Or paste Video URL</label>
                <input id="videoUrl" value={form.videoUrl} onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))} />
              </div>

              <div className="formGroup">
                <label htmlFor="visibility">Visibility</label>
                <select id="visibility" value={form.visibility} onChange={(e) => setForm((p) => ({ ...p, visibility: e.target.value }))}>
                  <option value="both">Both (Desktop & Mobile)</option>
                  <option value="desktop">Desktop only</option>
                  <option value="mobile">Mobile only</option>
                </select>
              </div>

              <div className="modalFooter">
                <button type="button" onClick={() => setIsOpen(false)} className="btnCancel" disabled={saving || uploading}>Close</button>
                <button type="submit" className="btnSave" disabled={saving || uploading}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-card {
            width: 240px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            overflow: hidden;
            transition: all 0.2s ease-in-out;
        }
        .video-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .video-thumbnail {
            height: 140px;
            background: #000;
        }
        .video-thumbnail video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .card-footer {
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-title {
            margin: 0;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .card-actions {
            display: flex;
            gap: 8px;
        }
        .action-btn {
            padding: 4px 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            cursor: pointer;
            font-size: 13px;
            background-color: #f5f5f5;
        }
        .action-btn.delete-btn {
            background-color: #fee2e2;
            color: #b91c1c;
            border-color: #fecaca;
        }

        /* Modal Styles */
        .modalBackdrop {
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex;
            align-items: center; justify-content: center; z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .modalContent {
            background: #ffffff; padding: 24px; border-radius: 12px;
            width: 540px; max-width: 95%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .modalTitle {
            margin: 0 0 20px 0; text-align: center; font-size: 24px; font-weight: 600; color: #333;
        }
        .formGroup { margin-bottom: 16px; }
        .formGroup label {
            display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #444;
        }
        .formGroup input {
            width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px;
            font-size: 16px; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .formGroup input:focus {
            outline: none; border-color: #0070f3; box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
        }
        .videoPreview {
            width: 100%;
            max-height: 250px;
            background: #f0f0f0;
            border-radius: 8px;
            margin-bottom: 12px;
            display: flex; align-items: center; justify-content: center;
            color: #888; border: 2px dashed #ccc;
        }
        .videoPreview video {
            width: 100%;
            max-height: 250px;
            border-radius: 6px;
        }
        .hiddenFileInput { display: none; }
        .uploadButton {
            display: block; width: 100%; text-align: center; box-sizing: border-box;
            padding: 10px 16px; background-color: #f5f5f5; border: 1px solid #ccc;
            border-radius: 6px; cursor: pointer; transition: background-color 0.2s; font-weight: 500;
        }
        .uploadButton.disabled { cursor: not-allowed; opacity: 0.7; }
        .uploadButton:not(.disabled):hover { background-color: #e0e0e0; }
        .progressContainer {
            width: 100%; background-color: #e0e0e0; border-radius: 4px;
            margin-top: 12px; height: 20px; overflow: hidden;
        }
        .progressBar {
            height: 100%; background-color: #0070f3; color: white; display: flex;
            align-items: center; justify-content: center; font-size: 12px;
            font-weight: bold; transition: width 0.3s ease-in-out;
        }
        .errorMessage { color: #d93025; font-size: 13px; margin-top: 8px; }
        .modalFooter {
            display: flex; justify-content: flex-end; gap: 12px;
            margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;
        }
        .modalFooter button {
            padding: 10px 20px; font-size: 15px; font-weight: 500; border-radius: 8px;
            border: 1px solid #ccc; cursor: pointer; transition: all 0.2s;
        }
        .btnCancel { background-color: #fff; color: #555; }
        .btnCancel:hover { background-color: #f5f5f5; }
        .btnSave { background-color: #111; color: #fff; border-color: #111; }
        .btnSave:hover { background-color: #333; }
        .modalFooter button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </>
  );
}
