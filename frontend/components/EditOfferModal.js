"use client";
import React, { useState } from 'react';

export default function EditOfferModal({ item, onClose, onSave }) {
  const [category, setCategory] = useState(item?.category || '');
  const [discount, setDiscount] = useState(item?.discount || '');
  const [image, setImage] = useState(item?.image || '');
  
  // State for file handling and upload progress
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  // Handle file selection and create a local preview
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file)); // Update preview
      setUploadError(null);
    }
  };

  const handleSave = async () => {
    let finalImageUrl = item?.image || ''; // Start with the original image URL

    // If a new file was selected, upload it first
    if (selectedFile) {
      setUploading(true);
      setUploadProgress(0);
      setUploadError(null);
      try {
        finalImageUrl = await uploadToCloudinary(selectedFile, setUploadProgress);
      } catch (error) {
        console.error(error);
        setUploadError('Image upload failed. Please try again.');
        setUploading(false);
        return; // Stop if upload fails
      }
      setUploading(false);
    }

    // Call the parent onSave with the final data
    onSave && onSave({ ...item, category, discount, image: finalImageUrl });
    onClose(); // Close modal on successful save
  };

  // Reusable Cloudinary upload function with progress tracking
  const uploadToCloudinary = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'yaritu_preset'); // YOUR UPLOAD PRESET
      formData.append('folder', 'YARITU/offers');

      const xhr = new XMLHttpRequest();
  xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, true); // YOUR CLOUD NAME

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
    <>
      <div className="modalBackdrop" onClick={onClose}>
        <div className="modalContent" onClick={(e) => e.stopPropagation()}>
          <h3 className="modalTitle">Edit Offer</h3>
          <div className="modalBody">
            {/* Left Column: Form Fields */}
            <div className="formColumn">
              <div className="formGroup">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Men's Wear"
                />
              </div>
              <div className="formGroup">
                <label htmlFor="discount">Discount Text</label>
                <input
                  id="discount"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="e.g., UP TO 50% OFF"
                />
              </div>
              <div className="actionButtons">
                <button onClick={onClose} className="btnCancel" disabled={uploading}>Cancel</button>
                <button onClick={handleSave} className="btnSave" disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Right Column: Image */}
            <div className="imageColumn">
              <div className="imagePreview">
                {image ? <img src={image} alt="offer preview" /> : <span>No Image</span>}
              </div>
              <label htmlFor="image-upload" className={`uploadButton ${uploading ? 'disabled' : ''}`}>
                Choose File
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hiddenFileInput"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {uploading && (
                <div className="progressContainer">
                  <div className="progressBar" style={{ width: `${uploadProgress}%` }}>
                    {uploadProgress > 10 && `${uploadProgress}%`}
                  </div>
                </div>
              )}
              {uploadError && <div className="errorMessage">{uploadError}</div>}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modalBackdrop {
            position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); display: flex;
            align-items: center; justify-content: center; z-index: 100;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .modalContent {
            background: #ffffff; padding: 24px; border-radius: 12px;
            width: 680px; max-width: 95%; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .modalTitle {
            margin: 0 0 20px 0; text-align: center; font-size: 24px; font-weight: 600; color: #333;
        }
        .modalBody {
            display: flex;
            gap: 24px;
        }
        .formColumn {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .formGroup {
            margin-bottom: 16px;
        }
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
        .imageColumn {
            width: 220px;
            text-align: center;
        }
        .imagePreview {
            width: 100%;
            height: 220px;
            border-radius: 8px;
            overflow: hidden;
            background: #f0f0f0;
            margin-bottom: 12px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #888;
        }
        .imagePreview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .hiddenFileInput {
            display: none;
        }
        .uploadButton {
            display: inline-block; width: 100%; padding: 10px 16px; background-color: #f5f5f5;
            border: 1px solid #ccc; border-radius: 6px; cursor: pointer; transition: background-color 0.2s;
            font-weight: 500; box-sizing: border-box;
        }
        .uploadButton.disabled {
            cursor: not-allowed; background-color: #e0e0e0; opacity: 0.7;
        }
        .uploadButton:not(.disabled):hover { background-color: #e0e0e0; }
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
        .errorMessage {
            color: #d93025; font-size: 13px; margin-top: 8px; text-align: left;
        }
        .actionButtons {
            display: flex; justify-content: flex-end; gap: 12px;
            margin-top: auto; padding-top: 16px; border-top: 1px solid #eee;
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
            .modalBody {
                flex-direction: column-reverse;
            }
            .imageColumn {
                width: 100%;
            }
            .imagePreview {
                width: 200px;
                height: 200px;
                margin: 0 auto 12px;
            }
        }
      `}</style>
    </>
  );
}