"use client";
import React, { useState, useEffect } from 'react';

export default function EditTestimonialModal({ item, onClose, onUpdated, onDeleted }) {
    const [name, setName] = useState(item?.name || '');
    const [quote, setQuote] = useState(item?.quote || '');
    const [rating, setRating] = useState(item?.rating || 5);
    // State for the actual file or final URL
    const [avatar, setAvatar] = useState(item?.avatar || '');
    // State for the temporary preview URL
    const [previewAvatar, setPreviewAvatar] = useState(item?.avatar || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setName(item?.name || '');
        setQuote(item?.quote || '');
        setRating(item?.rating || 5);
        setAvatar(item?.avatar || '');
        setPreviewAvatar(item?.avatar || ''); // Set initial preview from the item prop
    }, [item]);

    // Handle image file selection and create a temporary URL for preview
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Note: In a real application, you would upload this 'file' object to a service 
            // like Cloudinary. For the UI, we create a local URL to show a preview instantly.
            const localPreviewUrl = URL.createObjectURL(file);
            setPreviewAvatar(localPreviewUrl);
            // Here you would typically store the 'file' object itself to be uploaded later.
            // For this example, we'll just use the preview URL in the update.
            setAvatar(localPreviewUrl); 
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            // IMPORTANT: In a real app, if a new file was selected, you would first
            // upload it to your image hosting service, get the permanent URL, 
            // and then send that URL in the JSON body.
            const res = await fetch(`/api/testimonials/${item._id || item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, quote, rating, avatar }),
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json && (json.success || json.data)) {
                onUpdated && onUpdated(json.data || json);
                onClose && onClose();
            } else {
                console.error('Update failed', json);
                alert('Failed to update testimonial');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update testimonial');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this testimonial?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/testimonials/${item._id || item.id}`, { method: 'DELETE' });
            if (res.ok) {
                onDeleted && onDeleted(item);
                onClose && onClose();
            } else {
                alert('Failed to delete testimonial');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to delete testimonial');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <h3 className="modal-title">Edit Review</h3>
                    <div className="modal-body">
                        {/* Left Side: Form Fields */}
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

                        {/* Right Side: Avatar and Actions */}
                        <div className="sidebar">
                            <div className="avatar-upload">
                                <label htmlFor="avatar-input">
                                    <div className="avatar-preview">
                                        {previewAvatar ?
                                            <img src={previewAvatar} alt="Avatar Preview" /> :
                                            <div className="avatar-placeholder">
                                                <span>No Image</span>
                                            </div>
                                        }
                                    </div>
                                    <span className="upload-button">Choose File</span>
                                </label>
                                <input id="avatar-input" type="file" accept="image/*" onChange={handleFileChange} />
                            </div>

                            <div className="action-buttons">
                                <button onClick={onClose} disabled={loading} className="btn-cancel">Cancel</button>
                                <button onClick={handleUpdate} disabled={loading} className="btn-save">{loading ? 'Saving...' : 'Save'}</button>
                            </div>
                             <div className="delete-button-container">
                                <button onClick={handleDelete} disabled={loading} className="btn-delete">Delete Review</button>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 60;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                }
                .modal-content {
                    background: #ffffff;
                    padding: 24px;
                    border-radius: 12px;
                    width: 760px;
                    max-width: 95%;
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
                }
                .avatar-upload {
                    text-align: center;
                }
                .avatar-upload label {
                    cursor: pointer;
                }
                .avatar-preview {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    background: #f0f0f0;
                    margin: 0 auto 12px;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed #ccc;
                }
                .avatar-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .avatar-placeholder {
                    color: #888;
                    font-size: 14px;
                }
                .avatar-upload input[type="file"] {
                    display: none;
                }
                .upload-button {
                    font-size: 14px;
                    color: #0070f3;
                    font-weight: 500;
                }
                .action-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: auto; /* Pushes buttons to the bottom */
                    padding-top: 20px;
                }
                .action-buttons button {
                    flex: 1;
                    padding: 10px;
                    font-size: 15px;
                    font-weight: 500;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    cursor: pointer;
                    transition: background-color 0.2s, color 0.2s;
                }
                .btn-cancel {
                    background-color: #fff;
                    color: #555;
                }
                .btn-cancel:hover {
                    background-color: #f5f5f5;
                }
                .btn-save {
                    background-color: #111;
                    color: #fff;
                    border-color: #111;
                }
                .btn-save:hover {
                    background-color: #333;
                }
                .action-buttons button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .delete-button-container {
                    margin-top: 10px;
                    border-top: 1px solid #eee;
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
                @media (max-width: 640px) {
                    .modal-body {
                        flex-direction: column-reverse;
                    }
                    .sidebar {
                        width: 100%;
                    }
                    .action-buttons {
                         margin-top: 16px;
                    }
                }
            `}</style>
        </>
    );
}