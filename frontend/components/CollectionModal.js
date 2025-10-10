"use client";
import React, { useState, useRef, useEffect, useReducer } from 'react';
import './CollectionModal.css'; // <-- Import the new CSS file

// --- Constants for select options (better organization) ---
const CATEGORIES = ['Men', 'Women', 'Children'];

const OPTIONS_BY_CATEGORY = {
  Men: {
    occasions: ['Wedding', 'Haldi', 'Reception'],
    collectionTypes: ['Sherwani', 'Suit', 'Indo-Western', 'Blazer'],
  },
  Women: {
    occasions: ['Wedding', 'Haldi', 'Sangeet'],
    collectionTypes: ['Sari', 'Lehenga', 'Gown'],
  },
  Children: {
    occasions: ['Birthday', 'Festival', 'Wedding'],
    collectionTypes: ['Kurta', 'Frock', 'Lehenga'],
  }
};

// --- Reducer for complex form state management ---
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_DEPENDENT_FIELDS':
      return { ...state, occasion: '', collectionType: '', otherOccasion: '', otherCollectionType: '' };
    case 'LOAD_INITIAL':
      return { ...action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- Main Component ---
export default function CollectionModal({ initial = null, onClose, onSaved }) {
  // Determine if we are in "edit" mode
  const isEditMode = Boolean(initial?._id);

  // --- State Hooks ---
  const initialState = {
    title: initial?.title || '',
    description: initial?.description || '',
    category: initial?.category || 'Men',
    occasion: initial?.occasion || '',
    collectionType: initial?.collectionType || '',
    price: initial?.price || '',
    discountedPrice: initial?.discountedPrice || '',
    status: initial?.status || 'Available',
    isFeatured: !!initial?.isFeatured,
    tags: (initial?.tags || []).join(', '),
    otherOccasion: (initial?.occasion && !OPTIONS_BY_CATEGORY.Men.occasions.includes(initial.occasion) && !OPTIONS_BY_CATEGORY.Women.occasions.includes(initial.occasion) && !OPTIONS_BY_CATEGORY.Children.occasions.includes(initial.occasion)) ? initial.occasion : '',
    otherCollectionType: (initial?.collectionType && !OPTIONS_BY_CATEGORY.Men.collectionTypes.includes(initial.collectionType) && !OPTIONS_BY_CATEGORY.Women.collectionTypes.includes(initial.collectionType) && !OPTIONS_BY_CATEGORY.Children.collectionTypes.includes(initial.collectionType)) ? initial.collectionType : ''
  };

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [mainImagePreview, setMainImagePreview] = useState(initial?.imageUrl || '');
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImage2Preview, setMainImage2Preview] = useState(initial?.mainImage2 || '');
  const [mainImage2File, setMainImage2File] = useState(null);
  const [otherImagesPreview, setOtherImagesPreview] = useState(initial?.otherImages || []);
  const [otherImagesFiles, setOtherImagesFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const fileInputRef2 = useRef(null);
  const otherFilesInputRef = useRef(null);

  const handleRemoveOtherImage = (index) => {
    const newPreviews = [...otherImagesPreview];
    const newFiles = [...otherImagesFiles];

    // Revoke blob URL if it exists
    const removedPreview = newPreviews[index];
    if (removedPreview.startsWith('blob:')) {
        URL.revokeObjectURL(removedPreview);
    }

    newPreviews.splice(index, 1);
    
    // This is a simplification. If you need to map previews to files, a more complex state shape is needed
    // For now, we assume the file is at the same index if it was just added.
    // A more robust solution would be to store an array of objects like { preview, file }
    if (index < newFiles.length) {
        newFiles.splice(index, 1);
    }

    setOtherImagesPreview(newPreviews);
    setOtherImagesFiles(newFiles);
  };

  // --- Effects ---
  // Reset dependent fields when category changes
  useEffect(() => {
    dispatch({ type: 'RESET_DEPENDENT_FIELDS' });
  }, [state.category]);

  // Cleanup for image preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (mainImagePreview && mainImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mainImagePreview);
      }
      if (mainImage2Preview && mainImage2Preview.startsWith('blob:')) {
        URL.revokeObjectURL(mainImage2Preview);
      }
      otherImagesPreview.forEach(p => {
        if (p.startsWith('blob:')) {
          URL.revokeObjectURL(p);
        }
      })
    };
  }, [mainImagePreview, mainImage2Preview, otherImagesPreview]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    dispatch({
      type: 'SET_FIELD',
      field: name,
      value: type === 'checkbox' ? checked : value,
    });
     // Clear error for the field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, mainImage: 'Image size cannot exceed 5MB.' }));
      return;
    }

    setMainImageFile(file);
    if (mainImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImagePreview);
    }
    setMainImagePreview(URL.createObjectURL(file));
    if (errors.mainImage) {
      setErrors(prev => ({ ...prev, mainImage: null }));
    }
  };

  const handleMainImage2Change = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setErrors(prev => ({ ...prev, mainImage2: 'Image size cannot exceed 5MB.' }));
      return;
    }

    setMainImage2File(file);
    if (mainImage2Preview.startsWith('blob:')) {
      URL.revokeObjectURL(mainImage2Preview);
    }
    setMainImage2Preview(URL.createObjectURL(file));
    if (errors.mainImage2) {
      setErrors(prev => ({ ...prev, mainImage2: null }));
    }
  };

  const handleOtherImagesChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const newFiles = [...otherImagesFiles, ...files].slice(0, 5);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));

    // Clean up old blob URLs
    otherImagesPreview.forEach(p => {
        if (p.startsWith('blob:')) {
          URL.revokeObjectURL(p);
        }
    });

    setOtherImagesFiles(newFiles);
    setOtherImagesPreview(newPreviews);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!state.title.trim()) newErrors.title = 'Title is required.';
    if (!mainImagePreview && !mainImageFile) newErrors.mainImage = 'A main image is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const formData = new FormData();

    // Append all fields from state
    Object.keys(state).forEach(key => {
        // We handle 'other' fields separately
        if (key !== 'otherOccasion' && key !== 'otherCollectionType') {
            formData.append(key, state[key]);
        }
    });

    // Handle "Other" logic
    const finalOccasion = state.occasion === 'Other' ? state.otherOccasion : state.occasion;
    formData.set('occasion', finalOccasion);
    
    const finalCollectionType = state.collectionType === 'Other' ? state.otherCollectionType : state.collectionType;
    formData.set('collectionType', finalCollectionType);

    // Append image file if it's new
    if (mainImageFile) {
      formData.append('mainImage', mainImageFile);
    } else if (initial?.imageUrl) {
      formData.append('imageUrl', initial.imageUrl); // Keep old image
    }

    if (mainImage2File) {
      formData.append('mainImage2', mainImage2File);
    } else if (initial?.mainImage2) {
      formData.append('mainImage2Url', initial.mainImage2);
    }

    if (otherImagesFiles.length > 0) {
        otherImagesFiles.forEach(file => {
            formData.append('otherImages', file);
        });
    } else if (initial?.otherImages) {
        initial.otherImages.forEach(imgUrl => {
            formData.append('otherImagesUrls[]', imgUrl);
        })
    }
    
    try {
      const url = isEditMode ? `/api/collections/${initial._id}` : '/api/collections';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const result = await res.json();

      if (res.ok && result.success) {
        onSaved?.(result.data);
        onClose?.();
      } else {
        setErrors({ form: result.error || 'Failed to save the collection. Please try again.' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ form: 'An unexpected error occurred. Please check the console.' });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = OPTIONS_BY_CATEGORY[state.category] || { occasions: [], collectionTypes: [] };

  // --- JSX ---
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{isEditMode ? 'Edit Collection' : 'Add New Collection'}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          {/* Left Side - Form Fields */}
          <div className="form-fields">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input type="text" id="title" name="title" value={state.title} onChange={handleChange} />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" value={state.description} onChange={handleChange} rows={3} />
            </div>

            {/* Category */}
            <div className="form-group">
                <label htmlFor="category">Category</label>
                <select id="category" name="category" value={state.category} onChange={handleChange}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            
            {/* Occasion */}
            <div className="form-group">
                <label htmlFor="occasion">Occasion</label>
                <select id="occasion" name="occasion" value={state.occasion} onChange={handleChange}>
                    <option value="">Select Occasion</option>
                    {categoryOptions.occasions.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                    <option value="Other">Other</option>
                </select>
            </div>
            {state.occasion === 'Other' && (
                <div className="form-group indented">
                    <input type="text" name="otherOccasion" placeholder="Specify other occasion" value={state.otherOccasion} onChange={handleChange} />
                </div>
            )}
            
            {/* Collection Type */}
            <div className="form-group">
                <label htmlFor="collectionType">Collection Type</label>
                <select id="collectionType" name="collectionType" value={state.collectionType} onChange={handleChange}>
                    <option value="">Select Type</option>
                    {categoryOptions.collectionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    <option value="Other">Other</option>
                </select>
            </div>
            {state.collectionType === 'Other' && (
                <div className="form-group indented">
                    <input type="text" name="otherCollectionType" placeholder="Specify other type" value={state.otherCollectionType} onChange={handleChange} />
                </div>
            )}

            {/* Price Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input type="number" id="price" name="price" value={state.price} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="discountedPrice">Discounted Price</label>
                <input type="number" id="discountedPrice" name="discountedPrice" value={state.discountedPrice} onChange={handleChange} />
              </div>
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={state.status} onChange={handleChange}>
                <option>Available</option>
                <option>Out of Stock</option>
              </select>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input type="text" id="tags" name="tags" value={state.tags} onChange={handleChange} />
            </div>

             {/* Featured Checkbox */}
             <div className="form-group-checkbox">
                <input type="checkbox" id="isFeatured" name="isFeatured" checked={state.isFeatured} onChange={handleChange} />
                <label htmlFor="isFeatured">Mark as Featured Collection</label>
            </div>
          </div>
          {/* Right Side - Image & Actions */}
          <div className="form-sidebar">
            <div className="form-group">
              <label>Main Image *</label>
              <div className="image-uploader" onClick={() => fileInputRef.current?.click()}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                {mainImagePreview ? (
                  <img src={mainImagePreview} alt="main preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>Click to Upload</span>
                    <small>PNG, JPG, WEBP up to 5MB</small>
                  </div>
                )}
              </div>
              {errors.mainImage && <span className="error-text">{errors.mainImage}</span>}
            </div>
            <div className="form-group">
              <label>Main Image 2</label>
              <div className="image-uploader" onClick={() => fileInputRef2.current?.click()}>
                <input type="file" accept="image/*" ref={fileInputRef2} onChange={handleMainImage2Change} style={{ display: 'none' }} />
                {mainImage2Preview ? (
                  <img src={mainImage2Preview} alt="main 2 preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>Click to Upload</span>
                    <small>PNG, JPG, WEBP up to 5MB</small>
                  </div>
                )}
              </div>
              {errors.mainImage2 && <span className="error-text">{errors.mainImage2}</span>}
            </div>
            <div className="form-group">
                <label>Other Images (up to 5)</label>
                <div className="other-images-container">
                    {otherImagesPreview.map((src, i) => (
                        <div key={i} className="other-image-item">
                            <img src={src} alt={`other preview ${i+1}`} />
                            <button type="button" onClick={() => handleRemoveOtherImage(i)} className="remove-image-btn">&times;</button>
                        </div>
                    ))}
                    {otherImagesPreview.length < 5 && (
                        <div className="image-uploader-small" onClick={() => otherFilesInputRef.current?.click()}>
                             <input type="file" accept="image/*" multiple ref={otherFilesInputRef} onChange={handleOtherImagesChange} style={{ display: 'none' }} />
                            <span>+ Add</span>
                        </div>
                    )}
                </div>
            </div>
             {errors.form && <div className="error-box">{errors.form}</div>}
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
              <button type="button" onClick={handleSave} className="btn btn-primary" disabled={loading}>
                {loading ? (
                    <span className="spinner"></span>
                ) : (
                    isEditMode ? 'Save Changes' : 'Create Collection'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}