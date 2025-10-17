"use client";
import React, { useState, useRef, useEffect, useReducer } from 'react';
import './CollectionModal.css'; // <-- Import the new CSS file

// --- Constants for select options (stored/displayed in UPPERCASE) ---
const CATEGORIES = ['MEN', 'WOMEN', 'CHILDREN'];

const OPTIONS_BY_CATEGORY = {
  MEN: {
    occasions: ['WEDDING', 'HALDI', 'RECEPTION'],
    collectionTypes: ['SHERWANI', 'SUIT', 'INDO-WESTERN', 'BLAZER'],
  },
  WOMEN: {
    occasions: ['WEDDING', 'HALDI', 'SANGEET'],
    collectionTypes: ['SARI', 'LEHENGA', 'GOWN'],
  },
  CHILDREN: {
    occasions: ['BIRTHDAY', 'FESTIVAL', 'WEDDING'],
    collectionTypes: ['KURTA', 'FROCK', 'LEHENGA'],
  }
};

// Children-specific grouping (BOYS / GIRLS) and their types (UPPERCASE)
const CHILDREN_GROUPS = {
  BOYS: ['SUIT', 'KOTI', 'SHIRT-PENT', 'DHOTI'],
  GIRLS: ['FROCK', 'LEHENGA', 'GOWN', 'ANARKALI SUITS'],
};

// --- Reducer for complex form state management ---
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET_DEPENDENT_FIELDS':
      return { ...state, occasion: '', collectionType: '', collectionGroup: '' };
    case 'LOAD_INITIAL':
      return { ...action.payload };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- Main Component ---
export default function CollectionModal({ initial = null, onClose, onSaved, metaOptions = {}, collections = [] }) {
  // Determine if we are in "edit" mode
  const isEditMode = Boolean(initial?._id);

  // --- State Hooks ---
  const initialState = {
    title: initial?.title || '',
    description: initial?.description || '',
    productId: initial?.productId || '',
    category: (initial?.category || 'MEN').toString().toUpperCase(),
    occasion: (initial?.occasion || '').toString().toUpperCase(),
  collectionGroup: (initial?.collectionGroup || '').toString().toUpperCase(),
    collectionType: (initial?.collectionType || '').toString().toUpperCase(),
    price: initial?.price || '',
    discountedPrice: initial?.discountedPrice || '',
    status: initial?.status || 'Available',
    isFeatured: !!initial?.isFeatured,
    tags: (initial?.tags || []).join(', '),
  };

  const [state, dispatch] = useReducer(formReducer, initialState);
  // Accept multiple possible image key names from the collection document
  const existingMainImage = initial?.mainImage || initial?.imageUrl || initial?.image || '';
  const existingMainImage2 = initial?.mainImage2 || initial?.mainImage2Url || initial?.mainImage2Url || '';
  const existingOtherImages = initial?.otherImages || initial?.otherImageUrls || initial?.otherImageUrls || [];

  const [mainImagePreview, setMainImagePreview] = useState(existingMainImage || '');
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImage2Preview, setMainImage2Preview] = useState(existingMainImage2 || '');
  const [mainImage2File, setMainImage2File] = useState(null);
  const [otherImagesPreview, setOtherImagesPreview] = useState(Array.isArray(existingOtherImages) ? existingOtherImages : []);
  const [otherImagesFiles, setOtherImagesFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // NAYA STATE: Upload progress ke liye
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    // Normalize certain fields to uppercase for consistency
    const normalizedValue = (name === 'category' || name === 'occasion' || name === 'collectionType' || name === 'collectionGroup')
      ? (type === 'checkbox' ? checked : value.toString().toUpperCase())
      : (type === 'checkbox' ? checked : value);
    dispatch({ type: 'SET_FIELD', field: name, value: normalizedValue });
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
    const missing = [];

    if (!state.title.trim()) newErrors.title = 'Title is required.';
    if (!mainImagePreview && !mainImageFile) newErrors.mainImage = 'A main image is required.';

    // Product ID required
    if (!state.productId || !state.productId.toString().trim()) {
      missing.push('Product ID');
      newErrors.productId = 'Product ID is required and must be unique.';
    }

    // Category required
    if (!state.category || !state.category.toString().trim()) {
      missing.push('Category');
      newErrors.category = 'Category is required.';
    }

    // For CHILDREN require collectionGroup (BOYS/GIRLS), otherwise require occasion
    if (state.category === 'CHILDREN') {
      if (!state.collectionGroup || !state.collectionGroup.toString().trim()) {
        missing.push('Collection');
        newErrors.collectionGroup = 'Please select a collection (BOYS or GIRLS).';
      }
    } else {
      if (!state.occasion || !state.occasion.toString().trim()) {
        missing.push('Occasion');
        newErrors.occasion = 'Occasion is required.';
      }
    }

    // Collection Type required
    if (!state.collectionType || !state.collectionType.toString().trim()) {
      missing.push('Collection Type');
      newErrors.collectionType = 'Collection Type is required.';
    }

    setErrors(newErrors);

    if (missing.length > 0) {
      setErrors(prev => ({ ...prev, form: `Please fill the required fields: ${missing.join(', ')}.` }));
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  // --- NAYA HANDLE SAVE FUNCTION (XHR ke saath) ---
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setUploadProgress(0); // Progress ko reset karo
    const formData = new FormData();

    // Append all fields from state
    Object.keys(state).forEach(key => {
        if (key !== 'otherOccasion' && key !== 'otherCollectionType') {
            formData.append(key, state[key]);
        }
    });

    // Final normalized values
    formData.set('occasion', (state.occasion || '').toString().toUpperCase());
    formData.set('collectionType', (state.collectionType || '').toString().toUpperCase());

    // Images append karo
    if (mainImageFile) formData.append('mainImage', mainImageFile);
    else if (existingMainImage) formData.append('imageUrl', existingMainImage);

    if (mainImage2File) formData.append('mainImage2', mainImage2File);
    else if (existingMainImage2) formData.append('mainImage2Url', existingMainImage2);

    if (otherImagesFiles.length > 0) {
        otherImagesFiles.forEach(file => formData.append('otherImages', file));
    } else if (Array.isArray(existingOtherImages) && existingOtherImages.length) {
        existingOtherImages.forEach(imgUrl => formData.append('otherImagesUrls[]', imgUrl));
    }
    
    // --- XHR Logic ---
    const xhr = new XMLHttpRequest();
    const url = isEditMode ? `/api/collections/${initial._id}` : '/api/collections';
    const method = isEditMode ? 'PUT' : 'POST';

    xhr.open(method, url);

    // 1. Progress Event
      let optimisticSent = false;
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
          // If upload reached 100% and we haven't yet informed parent, send an optimistic placeholder
        if (percent === 100 && !optimisticSent) {
          optimisticSent = true;
          try {
            // build a more complete provisional object so the parent can render the full card
            const nowId = `pending-${Date.now()}`;
            const provisional = {
              _id: nowId,
              title: state.title || 'Uploading...',
              description: state.description || '',
              productId: state.productId || nowId,
              category: state.category || 'MEN',
              collectionType: state.collectionType || '',
              collectionGroup: state.collectionGroup || '',
              price: state.price || '',
              discountedPrice: state.discountedPrice || '',
              status: state.status || 'Available',
              isFeatured: !!state.isFeatured,
              tags: (state.tags || '').toString(),
              isPending: true,
              // Indicate image is still pending; parent can show other fields and a spinner over the image
              imagePending: true,
              // provide a temporary thumbnail preview (blob URL) if available so the card can show a preview
              thumbnail: mainImagePreview || '',
            };
            // Inform parent immediately so UI shows the new card while server finishes processing
            onSaved?.(provisional);
          } catch (e) {
            // swallow optimistic errors
          }
        }
        }
      });

    // 2. Success Event
    xhr.addEventListener('load', async () => {
      setLoading(false);
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch (e) {
        setErrors({ form: 'An invalid response was received from the server.' });
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && result.success) {
        // Success: Meta-options fetch karo (jaisa pehle tha)
        try {
          const metaRes = await fetch('/api/meta-options');
          const metaJson = await metaRes.json();
          if (metaRes.ok && metaJson.success) {
            onSaved?.(result.data, metaJson.data);
          } else {
            onSaved?.(result.data);
          }
        } catch (metaErr) {
          onSaved?.(result.data);
        }
        onClose?.();
      } else {
        // Server Error: Error message dikhao
        let errorMessage = "Failed to save the collection. Please try again.";
        if (result.error) {
          if (typeof result.error === 'object' && result.error.message) {
            errorMessage = result.error.message;
          } else {
            errorMessage = String(result.error);
          }
        }
        if (errorMessage.includes('Product ID must be unique') || errorMessage.includes('duplicate')) {
          setErrors({ form: 'Product ID already exists. Please choose another.' });
        } else {
          setErrors({ form: errorMessage });
        }
      }
    });

    // 3. Error Event
    xhr.addEventListener('error', () => {
      setLoading(false);
      setErrors({ form: 'An network error occurred. Please try again.' });
    });

    // 4. Request Bhejo
    xhr.send(formData);
  };
  // --- END OF NAYA HANDLE SAVE ---


  // Derive category options from metaOptions (server-populated) if available, otherwise fall back to static constants
  const catKeyLower = state.category ? state.category.toString().toLowerCase() : 'men';
  const derivedOccKey = `occasion_${catKeyLower}`;
  const derivedTypeKey = `collectionType_${catKeyLower}`;
  const derivedOccasions = (metaOptions[derivedOccKey] || []).filter(v => v && v.toString().toUpperCase() !== 'OTHER');
  const derivedTypes = (metaOptions[derivedTypeKey] || []).filter(v => v && v.toString().toUpperCase() !== 'OTHER');
  const categoryOptions = {
    occasions: derivedOccasions.length ? derivedOccasions : (OPTIONS_BY_CATEGORY[state.category]?.occasions || []),
    collectionTypes: derivedTypes.length ? derivedTypes : (OPTIONS_BY_CATEGORY[state.category]?.collectionTypes || []),
  };
  // Determine collection type options: for Children use selected group (Boys/Girls), otherwise use category mapping
  let collectionTypeOptions = [];
  if (state.category === 'CHILDREN') {
    const group = state.collectionGroup ? state.collectionGroup.toString().toUpperCase() : '';
    const key = group === 'BOYS' ? 'collectionType_children_boys' : (group === 'GIRLS' ? 'collectionType_children_girls' : null);
    const metaList = key ? (metaOptions[key] || []) : [];
    const cleaned = (metaList || []).filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    const fallback = group === 'BOYS' ? CHILDREN_GROUPS.BOYS : (group === 'GIRLS' ? CHILDREN_GROUPS.GIRLS : []);
    collectionTypeOptions = cleaned.length ? cleaned : fallback;
  } else {
    collectionTypeOptions = (categoryOptions.collectionTypes || []);
  }

  // --- JSX ---
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
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

            {/* Product ID */}
            <div className="form-group">
              <label htmlFor="productId">Product ID <span style={{fontSize:12,fontWeight:400,color:'#666'}}>(required, must be unique)</span></label>
              <input type="text" id="productId" name="productId" value={state.productId} onChange={handleChange} />
              {errors.productId && <span className="error-text">{errors.productId}</span>}
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
            
            {/* Occasion (or Collection group for Children) */}
            {state.category !== 'CHILDREN' ? (
              <>
                <div className="form-group">
                    <label htmlFor="occasion">Occasion</label>
                    <select id="occasion" name="occasion" value={state.occasion} onChange={handleChange}>
                      <option value="">SELECT OCCASION</option>
                      {/* If the current value isn't in the known list, show it so editors see the saved value */}
                      {state.occasion && state.occasion !== '' && !categoryOptions.occasions.includes(state.occasion) && (
                        <option key={state.occasion} value={state.occasion}>{state.occasion}</option>
                      )}
                      {categoryOptions.occasions.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                    </select>
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="collectionGroup">Collection</label>
                <select id="collectionGroup" name="collectionGroup" value={state.collectionGroup} onChange={handleChange}>
                  <option value="">SELECT COLLECTION</option>
                  <option value="BOYS">BOYS</option>
                  <option value="GIRLS">GIRLS</option>
                </select>
              </div>
            )}
            
            {/* Collection Type */}
            <div className="form-group">
                <label htmlFor="collectionType">Collection Type</label>
            <select id="collectionType" name="collectionType" value={state.collectionType} onChange={handleChange}>
              <option value="">SELECT TYPE</option>
              {/* Show saved value if it's not present in the current options */}
              {state.collectionType && state.collectionType !== '' && !collectionTypeOptions.includes(state.collectionType) && (
                <option key={state.collectionType} value={state.collectionType}>{state.collectionType}</option>
              )}
              {collectionTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            </div>

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

            {/* Tags and Featured options removed per requirements */}
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
             
            {/* NAYA JSX: Progress bar ke liye */}
            {loading && uploadProgress > 0 && (
              <div className="upload-progress-container">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                <span className="upload-progress-text">Uploading... {uploadProgress}%</span>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
              <button type="button" onClick={handleSave} className="btn btn-primary" disabled={loading}>
                {loading && uploadProgress === 0 ? ( // Spinner sirf tab dikhao jab progress shuru na hua ho
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