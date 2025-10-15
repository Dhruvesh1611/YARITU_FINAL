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
      return { ...state, occasion: '', collectionType: '', otherOccasion: '', otherCollectionType: '', collectionGroup: '' };
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
  otherOccasion: (initial?.occasion && !OPTIONS_BY_CATEGORY.MEN?.occasions?.includes(initial.occasion.toString().toUpperCase()) && !OPTIONS_BY_CATEGORY.WOMEN?.occasions?.includes(initial.occasion.toString().toUpperCase()) && !OPTIONS_BY_CATEGORY.CHILDREN?.occasions?.includes(initial.occasion.toString().toUpperCase())) ? initial.occasion.toString().toUpperCase() : '',
  otherCollectionType: (initial?.collectionType && !OPTIONS_BY_CATEGORY.MEN?.collectionTypes?.includes(initial.collectionType.toString().toUpperCase()) && !OPTIONS_BY_CATEGORY.WOMEN?.collectionTypes?.includes(initial.collectionType.toString().toUpperCase()) && !OPTIONS_BY_CATEGORY.CHILDREN?.collectionTypes?.includes(initial.collectionType.toString().toUpperCase())) ? initial.collectionType.toString().toUpperCase() : ''
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

    // If user provided an 'other' value, ensure it doesn't already exist in metaOptions or in current collections for this category
    const catKey = state.category ? state.category.toString().toLowerCase() : 'men';
    const occKey = `occasion_${catKey}`;
    const typeKey = `collectionType_${catKey}`;

    const existingOccasions = new Set();
    (metaOptions[occKey] || []).forEach(x => { if (x) existingOccasions.add(x.toString().toLowerCase()); });
    (collections || []).forEach(c => { if (c.occasion) existingOccasions.add(c.occasion.toString().toLowerCase()); });

    const existingTypes = new Set();
    (metaOptions[typeKey] || []).forEach(x => { if (x) existingTypes.add(x.toString().toLowerCase()); });
    (collections || []).forEach(c => { if (c.collectionType) existingTypes.add(c.collectionType.toString().toLowerCase()); });

    if (state.occasion === 'OTHER' && state.otherOccasion && state.otherOccasion.trim()) {
      if (existingOccasions.has(state.otherOccasion.trim().toLowerCase())) {
        newErrors.otherOccasion = 'This occasion already exists.';
      }
    }

    if (state.collectionType === 'OTHER' && state.otherCollectionType && state.otherCollectionType.trim()) {
      if (existingTypes.has(state.otherCollectionType.trim().toLowerCase())) {
        newErrors.otherCollectionType = 'This type already exists.';
      }
    }

    setErrors(newErrors);

    if (missing.length > 0) {
      setErrors(prev => ({ ...prev, form: `Please fill the required fields: ${missing.join(', ')}.` }));
      return false;
    }

    // If we have other-field duplicate errors, consider form invalid
    if (newErrors.otherOccasion || newErrors.otherCollectionType) return false;

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

    // Handle "Other" logic (normalize other values to UPPERCASE)
    const finalOccasion = (state.occasion && state.occasion.toString().toUpperCase() === 'OTHER')
      ? (state.otherOccasion || '').toString().toUpperCase().trim()
      : (state.occasion || '').toString().toUpperCase();
    formData.set('occasion', finalOccasion);

    const finalCollectionType = (state.collectionType && state.collectionType.toString().toUpperCase() === 'OTHER')
      ? (state.otherCollectionType || '').toString().toUpperCase().trim()
      : (state.collectionType || '').toString().toUpperCase();
    formData.set('collectionType', finalCollectionType);

    // Append image file if it's new
    if (mainImageFile) {
      formData.append('mainImage', mainImageFile);
    } else if (existingMainImage) {
      // Keep old image URL so the server can reuse it
      formData.append('imageUrl', existingMainImage);
    }

    if (mainImage2File) {
      formData.append('mainImage2', mainImage2File);
    } else if (existingMainImage2) {
      formData.append('mainImage2Url', existingMainImage2);
    }

    if (otherImagesFiles.length > 0) {
        otherImagesFiles.forEach(file => {
            formData.append('otherImages', file);
        });
    } else if (Array.isArray(existingOtherImages) && existingOtherImages.length) {
        existingOtherImages.forEach(imgUrl => {
            formData.append('otherImagesUrls[]', imgUrl);
        })
    }
    
    try {
      // Include any newly entered 'other' options so the server can create MetaOption docs
      if (state.otherOccasion && state.otherOccasion.toString().trim()) {
        formData.append('newOptions[occasion_' + state.category.toLowerCase() + ']', state.otherOccasion.toString().toUpperCase().trim());
      }
      if (state.otherCollectionType && state.otherCollectionType.toString().trim()) {
        formData.append('newOptions[collectionType_' + state.category.toLowerCase() + ']', state.otherCollectionType.toString().toUpperCase().trim());
      }

      const url = isEditMode ? `/api/collections/${initial._id}` : '/api/collections';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const result = await res.json();

      if (res.ok && result.success) {
        // After saving, re-fetch meta-options so parent UI can refresh filter lists immediately
        try {
          const metaRes = await fetch('/api/meta-options');
          const metaJson = await metaRes.json();
          if (metaRes.ok && metaJson.success) {
            // Provide updated meta-options to parent via onSaved (if parent expects it)
            onSaved?.(result.data, metaJson.data);
          } else {
            onSaved?.(result.data);
          }
        } catch (metaErr) {
          // If meta-options fetch fails, still call onSaved with the saved doc
          onSaved?.(result.data);
        }

        onClose?.();
      } else {
        // Map common server messages to friendlier errors
        const friendly = (result.error || '').toString();
        if (friendly.includes('Product ID must be unique') || friendly.includes('duplicate')) {
          setErrors({ form: 'Product ID already exists. Please choose another.' });
        } else {
          setErrors({ form: result.error || 'Failed to save the collection. Please try again.' });
        }
      }
    } catch (err) {
      console.error(err);
      setErrors({ form: 'An unexpected error occurred. Please check the console.' });
    } finally {
      setLoading(false);
    }
  };

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
    // derive types for the selected child group from existing collections (so new saved types appear)
    const group = state.collectionGroup ? state.collectionGroup.toString().toUpperCase() : '';
    const derived = [];
    (collections || []).forEach(c => {
      try {
        if ((c.category || '').toString().toUpperCase() === 'CHILDREN') {
          const g = (c.childCategory || c.collectionGroup || '').toString().toUpperCase();
          const t = (c.collectionType || '').toString().toUpperCase();
          if (g && t) {
            if (!derived.includes(t)) derived.push(t);
          }
        }
      } catch (e) { /* ignore malformed */ }
    });
    // if derived list is empty fall back to constants
    const fallback = state.collectionGroup === 'BOYS' ? CHILDREN_GROUPS.BOYS : (state.collectionGroup === 'GIRLS' ? CHILDREN_GROUPS.GIRLS : []);
    collectionTypeOptions = derived.length ? derived.filter(t => {
      // only include types that belong to selected group when group selected
      if (!group) return true;
      // we don't have authoritative mapping of type->group; include all derived types when group equals their saved group
      return (collections || []).some(c => ((c.collectionType||'').toString().toUpperCase() === t) && ((c.childCategory||c.collectionGroup||'').toString().toUpperCase() === group));
    }) : fallback;
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
                      {state.occasion && state.occasion !== '' && !categoryOptions.occasions.includes(state.occasion) && state.occasion !== 'OTHER' && (
                        <option key={state.occasion} value={state.occasion}>{state.occasion}</option>
                      )}
                      {categoryOptions.occasions.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                      <option value="OTHER">OTHER</option>
                    </select>
                </div>
                {state.occasion === 'OTHER' && (
                    <div className="form-group indented">
            <input type="text" name="otherOccasion" placeholder="Specify other occasion" value={state.otherOccasion} onChange={handleChange} />
            {errors.otherOccasion && <span className="error-text">{errors.otherOccasion}</span>}
                    </div>
                )}
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="collectionGroup">Collection</label>
                <select id="collectionGroup" name="collectionGroup" value={state.collectionGroup} onChange={handleChange}>
                  <option value="">SELECT COLLECTION</option>
                  <option value="BOYS">BOYS COLLECTION</option>
                  <option value="GIRLS">GIRLS COLLECTION</option>
                </select>
              </div>
            )}
            
            {/* Collection Type */}
            <div className="form-group">
                <label htmlFor="collectionType">Collection Type</label>
            <select id="collectionType" name="collectionType" value={state.collectionType} onChange={handleChange}>
              <option value="">SELECT TYPE</option>
              {/* Show saved value if it's not present in the current options */}
              {state.collectionType && state.collectionType !== '' && !collectionTypeOptions.includes(state.collectionType) && state.collectionType !== 'OTHER' && (
                <option key={state.collectionType} value={state.collectionType}>{state.collectionType}</option>
              )}
              {collectionTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
              <option value="OTHER">OTHER</option>
            </select>
            </div>
            {state.collectionType === 'OTHER' && (
        <div className="form-group indented">
          <input type="text" name="otherCollectionType" placeholder="Specify other type" value={state.otherCollectionType} onChange={handleChange} />
          {errors.otherCollectionType && <span className="error-text">{errors.otherCollectionType}</span>}
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