"use client";
import React, { useState, useEffect } from 'react';

export default function EditTestimonialModal({ item, onClose, onUpdated, onDeleted }) {
    // --- Existing States ---
    const [name, setName] = useState(item?.name || '');
    const [quote, setQuote] = useState(item?.quote || '');
    const [rating, setRating] = useState(item?.rating || 5);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Upload progress for current file

    // --- NEW States for Video and Thumbnail ---
    // 1. Files for upload
    const [videoFile, setVideoFile] = useState(null);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    
    // 2. URLs for Preview (Initial URL from item, then local temp URL, then final Cloudinary URL)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState(item?.videoUrl || ''); // Video URL
    const [thumbnailPreviewUrl, setThumbnailUrl] = useState(item?.thumbnailUrl || item?.avatarUrl || item?.avatar || ''); // Thumbnail URL (using avatarUrl as fallback)

    // Upload helper (No change needed here)
    const uploadToServer = async (file, onProgress) => {
        const fd = new FormData();
        fd.append('file', file);
        // Important: Agar Video hai toh 'video' folder use karo for better organization
        const folder = file.type.startsWith('video/') ? 'YARITU/videos' : 'YARITU/thumbnails'; 
        fd.append('folder', folder);
        
        // ... rest of the upload logic ...
        // NOTE: The actual fetch implementation must be provided externally or handled here, assuming '/api/upload' works.
        const res = await fetch('/api/upload', { 
            method: 'POST', 
            body: fd 
            // The original code did not have an onProgress handler in the fetch. 
            // Keeping it simple as per original structure.
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json || !json.success) throw new Error((json && json.error) || 'Server upload failed');
        return json.data;
    };

    // --- useEffect for component reset/initialization ---
    useEffect(() => {
        setName(item?.name || '');
        setQuote(item?.quote || '');
        setRating(item?.rating || 5);
        
        // Reset selected files and set permanent URLs from props
        setVideoFile(null);
        setThumbnailFile(null);
        setVideoPreviewUrl(item?.videoUrl || '');
        setThumbnailUrl(item?.thumbnailUrl || item?.avatarUrl || item?.avatar || '');
    }, [item]);

    // --- NEW Handlers for two separate file inputs ---

    // 1. Handle Video File Selection
    const handleVideoChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                // Using console.error instead of alert as per general guideline
                console.error('Please select a video file.');
                return;
            }
            const localPreviewUrl = URL.createObjectURL(file);
            setVideoPreviewUrl(localPreviewUrl);
            setVideoFile(file); // Set the file to be uploaded later
        }
    };

    // 2. Handle Thumbnail File Selection
    const handleThumbnailChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                // Using console.error instead of alert as per general guideline
                console.error('Please select an image file for the thumbnail.');
                return;
            }
            const localPreviewUrl = URL.createObjectURL(file);
            setThumbnailUrl(localPreviewUrl);
            setThumbnailFile(file); // Set the file to be uploaded later
        }
    };

    // --- Updated handleUpdate to manage two uploads ---
    const handleUpdate = async () => {
        setLoading(true);
        try {
            let finalVideoUrl = item?.videoUrl || '';
            let finalThumbnailUrl = item?.thumbnailUrl || item?.avatarUrl || item?.avatar || '';
            
            // 1. Upload NEW Video File (Agar select kiya gaya hai)
            if (videoFile) {
                setUploadProgress(10); // Start progress for video
                const videoUploadResult = await uploadToServer(videoFile);
                finalVideoUrl = videoUploadResult?.secure_url || videoUploadResult?.url || finalVideoUrl;
                setVideoPreviewUrl(finalVideoUrl); // Update the preview to the permanent URL
                setVideoFile(null); // Clear file
            }
            
            // 2. Upload NEW Thumbnail File (Agar select kiya gaya hai)
            if (thumbnailFile) {
                setUploadProgress(50); // Start progress for thumbnail
                const thumbnailUploadResult = await uploadToServer(thumbnailFile);
                finalThumbnailUrl = thumbnailUploadResult?.secure_url || thumbnailUploadResult?.url || finalThumbnailUrl;
                setThumbnailUrl(finalThumbnailUrl); // Update the preview to the permanent URL
                setThumbnailFile(null); // Clear file
            }

            setUploadProgress(90);

            // 3. Update MongoDB Atlas with both permanent URLs
            const res = await fetch(`/api/testimonials/${item._id || item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    quote, 
                    rating, 
                    // Naye fields bheje ja rahe hain
                    videoUrl: finalVideoUrl, 
                    thumbnailUrl: finalThumbnailUrl 
                }),
            });
            
            // ... (Rest of the update success/failure logic)
            const json = await res.json().catch(() => null);
            if (res.ok && json && (json.success || json.data)) {
                onUpdated && onUpdated(json.data || json);
                onClose && onClose();
            } else {
                console.error('Update failed', json);
                // alert('Failed to update testimonial'); // Use console error instead of alert
            }
        } catch (err) {
            console.error('Update operation failed:', err);
            // alert('Failed to update testimonial'); // Use console error instead of alert
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };
    
    // NOTE: handleDelete is assumed to be defined elsewhere or is standard and was omitted.
    // For completeness, adding a placeholder for handleDelete:
    const handleDelete = () => {
        // IMPORTANT: window.confirm() must be replaced by a custom modal UI component for full compliance.
        if (window.confirm("Are you sure you want to delete this testimonial?")) {
            // Placeholder: Replace with actual fetch call to delete API
            console.log(`Deleting testimonial ${item._id || item.id}`);
            onDeleted && onDeleted(item._id || item.id);
            onClose && onClose();
        }
    };


    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3 className="modal-title">Edit Review</h3>
                    <div className="modal-body">
                        {/* Left Side: Form Fields (No Change) */}
                        <div className="form-fields">
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input id="name" placeholder="Enter customer's name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="review">Review</label>
                                <textarea id="review" placeholder="Enter the review" value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="rating">Rating</label>
                                <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                                    {[5, 4, 3, 2, 1].map(num => <option key={num} value={num}>{num}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Right Side: Media and Actions (MAJOR CHANGES HERE) */}
                        <div className="sidebar">
                            
                            {/* --- Video Input --- */}
                            <div className="avatar-upload">
                                <label>Replace Video</label>
                                <div className="video-preview-container">
                                    {videoPreviewUrl ? (
                                        <video src={videoPreviewUrl} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="avatar-placeholder" style={{ color: '#fff', fontSize: '14px', paddingTop: '30px' }}>No Video Selected</div>
                                    )}
                                </div>
                                
                                <label htmlFor="video-input" style={{ display: 'block', cursor: 'pointer' }}>
                                    <span className="upload-button">Choose Video</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>{videoFile ? videoFile.name : 'No file chosen'}</span>
                                </label>
                                <input id="video-input" type="file" accept="video/*" onChange={handleVideoChange} style={{ display: 'none' }} />
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />

                            {/* --- Thumbnail Input --- */}
                            <div className="avatar-upload">
                                <label>Replace Thumbnail</label>
                                <div className="avatar-preview">
                                    {thumbnailPreviewUrl ?
                                        <img src={thumbnailPreviewUrl} alt="Thumbnail Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} /> :
                                        <div className="avatar-placeholder">
                                            <span>No Image</span>
                                        </div>
                                    }
                                </div>
                                <label htmlFor="thumbnail-input" style={{ display: 'block', cursor: 'pointer' }}>
                                    <span className="upload-button">Choose Thumbnail</span>
                                    <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>{thumbnailFile ? thumbnailFile.name : 'No file chosen'}</span>
                                </label>
                                <input id="thumbnail-input" type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: 'none' }} />
                            </div>
                            
                            {/* --- Action Buttons (Desktop Flow) --- */}
                            <div className="action-buttons-desktop" style={{ marginTop: '20px' }}>
                                {loading && uploadProgress > 0 && uploadProgress < 100 && (
                                    <p style={{ fontSize: '12px', color: '#0070f3', textAlign: 'center', width: '100%', marginBottom: '10px' }}>
                                        Uploading: {uploadProgress}%
                                    </p>
                                )}
                                <button onClick={onClose} disabled={loading} className="btn-cancel">Cancel</button>
                                <button onClick={handleUpdate} disabled={loading} className="btn-save">{loading ? 'Saving...' : 'Save'}</button>
                            </div>
                            
                            <div className="delete-button-container-desktop">
                                <button onClick={handleDelete} disabled={loading} className="btn-delete">Delete Review</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Mobile Fixed Action Bar (Outside Modal Content) --- */}
            <div className="mobile-action-bar">
                 {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <p style={{ fontSize: '12px', color: '#0070f3', textAlign: 'center', width: '100%', marginBottom: '10px', paddingTop: '10px' }}>
                        Uploading: {uploadProgress}%
                    </p>
                )}
                <div className="action-buttons-mobile">
                    <button onClick={onClose} disabled={loading} className="btn-cancel">Cancel</button>
                    <button onClick={handleUpdate} disabled={loading} className="btn-save">{loading ? 'Saving...' : 'Save'}</button>
                </div>
                <div className="delete-button-container-mobile">
                    <button onClick={handleDelete} disabled={loading} className="btn-delete">Delete Review</button>
                </div>
            </div>

            <style jsx>{`
                /* General Styles (Unchanged) */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 60;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    padding: 20px; 
                }
                .modal-content {
                    background: #ffffff;
                    padding: 24px;
                    border-radius: 12px;
                    width: 760px;
                    max-width: 95%;
                    max-height: calc(100vh - 40px);
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch; 
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                }
                .modal-title {
                    margin: 0 0 20px 0;
                    text-align: center;
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                }
                .modal-body {
                    display: flex;
                    gap: 24px;
                }
                .form-fields {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .form-group label {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 8px;
                    color: #444;
                }
                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #0070f3;
                    box-shadow: 0 0 0 2px rgba(0, 112, 243, 0.2);
                }
                .form-group textarea {
                    resize: vertical;
                }
                .sidebar {
                    width: 200px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px; 
                    justify-content: space-between; 
                }
                .avatar-upload {
                    text-align: center;
                    padding: 5px 0;
                }
                .video-preview-container { 
                    width: 150px;
                    height: 100px;
                    border-radius: 8px;
                    background: #f0f0f0;
                    margin: 0 auto 12px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed #ccc;
                    background-color: #000; /* Video background */
                }
                .avatar-preview {
                    width: 150px;
                    height: 100px;
                    border-radius: 8px;
                    background: #f0f0f0;
                    margin: 0 auto 12px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed #ccc;
                }
                .avatar-placeholder {
                    color: #888;
                    font-size: 14px;
                }
                .upload-button {
                    font-size: 14px;
                    color: #0070f3;
                    font-weight: 500;
                }

                /* Desktop/Common Button Styles */
                .action-buttons-desktop, .action-buttons-mobile {
                    display: flex;
                    gap: 8px;
                    padding-top: 20px;
                }
                .action-buttons-desktop button, .action-buttons-mobile button {
                    flex: 1;
                    padding: 10px;
                    font-size: 15px;
                    font-weight: 500;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    cursor: pointer;
                    transition: background-color 0.2s, color 0.2s;
                }
                .btn-cancel { background-color: #fff; color: #555; }
                .btn-cancel:hover { background-color: #f5f5f5; }
                .btn-save { background-color: #111; color: #fff; border-color: #111; }
                .btn-save:hover { background-color: #333; }
                button:disabled { opacity: 0.6; cursor: not-allowed; }

                .delete-button-container-desktop {
                    margin-top: 10px;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }
                .delete-button-container-mobile {
                    padding-top: 10px;
                }
                .btn-delete {
                    width: 100%;
                    padding: 10px;
                    font-size: 15px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    background-color: transparent;
                    color: #b91c1c;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                .btn-delete:hover {
                    background-color: #fee2e2;
                }
                
                /* --- MOBILE STYLES FIX --- */
                .mobile-action-bar {
                    display: none; /* Hide by default on desktop */
                }
                .action-buttons-desktop, .delete-button-container-desktop {
                    display: block; /* Show by default on desktop */
                }

                @media (max-width: 640px) {
                    /* Hide desktop action buttons inside sidebar */
                    .action-buttons-desktop, .delete-button-container-desktop {
                        display: none;
                    }

                    /* Show mobile action bar */
                    .mobile-action-bar {
                        display: block;
                        position: fixed; /* CRITICAL FIX: Fix to the viewport */
                        bottom: 0;
                        left: 0;
                        right: 0;
                        z-index: 100;
                        background: #fff;
                        box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
                        padding: 12px 16px; /* Add padding to match modal content */
                        border-radius: 0;
                    }
                    .action-buttons-mobile {
                         padding-top: 0; /* Already padded by parent */
                    }

                    /* Adjust modal content for mobile */
                    .modal-body {
                        flex-direction: column-reverse;
                    }
                    .sidebar {
                        width: 100%;
                    }
                    .modal-content {
                        width: calc(100% - 32px);
                        padding: 16px;
                        border-radius: 10px;
                        /* Increased bottom padding to ensure content is visible above the fixed bar */
                        padding-bottom: 150px; 
                    }
                    .modal-title { font-size: 20px; }
                    .video-preview-container { width: 100%; height: 180px; margin: 0 0 12px 0; }
                    .avatar-preview { width: 100%; height: 100px; margin: 0 0 12px 0; }
                    .form-group input, .form-group textarea, .form-group select { font-size: 16px; padding: 12px; }
                    .action-buttons-mobile button { padding: 12px; font-size: 16px; }
                }
            `}</style>
        </>
    );
}
