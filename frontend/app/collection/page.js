'use client';

import React,{useState,useEffect,useRef} from 'react';
import styles from './collection.module.css';
import Pagination from '../../components/Pagination';
import ProductModal from '../../components/ProductModal';
import {useSession} from 'next-auth/react';
import CollectionModal from '../../components/CollectionModal';
import JewelleryModal from '../../components/JewelleryModal';
import ProductCard from '../../components/ProductCard';
import CategoryMetaEditor from '../../components/CategoryMetaEditor';

const allProducts = [];
const PRODUCTS_PER_PAGE = 8;
const COLLECTIONS_CACHE_KEY = 'yaritu_collections_v1';
const META_CACHE_KEY = 'yaritu_meta_v1';

export default function Collection() {
const [activeCategory, setActiveCategory] = useState('ALL');
const [activeType, setActiveType] = useState(null);
const [activeSubcategory, setActiveSubcategory] = useState(null);
const [activeOccasion, setActiveOccasion] = useState(null);
const [filteredProducts, setFilteredProducts] = useState(allProducts.slice());
const {data: session} = useSession();
const isAdmin = !!(session?.user?.role === 'admin' || session?.user?.isAdmin);
const [jewelleryMode, setJewelleryMode] = useState(false);
const [jewelleryItems, setJewelleryItems] = useState([]);
const [selectedStoreFilter, setSelectedStoreFilter] = useState('');
const [storesList, setStoresList] = useState([]);
const [collections, setCollections] = useState([]);
const [metaOptions, setMetaOptions] = useState({});
const [showModal, setShowModal] = useState(false);
const [editingCollection, setEditingCollection] = useState(null);
const [showJewelleryModal, setShowJewelleryModal] = useState(false);
const [currentPage, setCurrentPage] = useState(1);
const [selectedProduct, setSelectedProduct] = useState(null);
const [viewMode, setViewMode] = useState('grid');
const [openDropdown, setOpenDropdown] = useState(null);
const [showMetaEditor, setShowMetaEditor] = useState(false);
const [editorCategory, setEditorCategory] = useState(null);

const collectionTitleRef = useRef(null);
const collectionContentRef = useRef(null);
const dropdownsContainerRef = useRef(null);

useEffect(() => {
    if (!activeCategory && !jewelleryMode) {
        setFilteredProducts([]);
        setCurrentPage(1);
        return;
    }
    const source = (collections && collections.length) ? collections : allProducts;
    let products = [];
    if (activeCategory === 'ALL') {
        products = source.slice();
    } else {
        products = source.filter(p => (p.category || '').toUpperCase() === activeCategory);
    }
    if (activeSubcategory) {
        const sub = activeSubcategory.toString().toUpperCase();
        if (activeCategory === 'CHILDREN') {
            products = products.filter(p => {
                const group = (p.childCategory || p.collectionGroup || '').toString().toUpperCase();
                if (activeType) {
                    const t = (p.collectionType || p.type || '').toString().toUpperCase();
                    const typeMatches = (t === activeType.toUpperCase()) || (p.description || '').toUpperCase().includes(activeType.toUpperCase());
                    return (group === sub && typeMatches) || (!group && typeMatches);
                }
                return group === sub || (p.description || '').toUpperCase().includes(sub);
            });
        } else {
            products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === sub) || ((p.description||'').toUpperCase().includes(sub)));
        }
    }
    if (activeType) {
        const t = activeType.toUpperCase();
        products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === t) || ((p.description||'').toUpperCase().includes(t)) || ((p.title||p.name||'').toUpperCase().includes(t)));
    } else if (activeOccasion) {
        products = products.filter(p => (p.occasion || '').toUpperCase() === activeOccasion.toUpperCase());
    }

setFilteredProducts(products);
setCurrentPage(1);

}, [activeCategory, activeType, activeOccasion, activeSubcategory, collections, jewelleryMode]);

useEffect(() => {
    try {
        const raw = localStorage.getItem(COLLECTIONS_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
                setCollections(parsed);
                if (!jewelleryMode && (activeCategory === 'ALL' || !activeCategory)) {
                    setFilteredProducts(parsed.slice());
                }
            }
        }
        const mRaw = localStorage.getItem(META_CACHE_KEY);
        if (mRaw) {
            const mParsed = JSON.parse(mRaw);
            if (mParsed && typeof mParsed === 'object') setMetaOptions(mParsed);
        }
    } catch (e) {
        console.error('Failed to hydrate cache', e);
    }
}, []);

useEffect(() => {
    let mounted = true;
    (async () => {
        try {
            const [resCollections, resMeta] = await Promise.all([
                fetch('/api/collections'),
                fetch('/api/meta-options')
            ]);
            try {
                const rs = await fetch('/api/stores');
                if (rs.ok) {
                    const js = await rs.json();
                    if (js && js.success) setStoresList(js.data || []);
                }
            } catch (e) { console.error('Failed to fetch stores', e); }
            try {
                const rj = await fetch('/api/jewellery');
                if (rj.ok) {
                    const jj = await rj.json();
                    if (jj.success) setJewelleryItems(jj.data || []);
                }
            } catch (_) {}
            const j = await resCollections.json();
            const m = await resMeta.json();
            if (resCollections.ok && j.success && mounted) {
                setCollections(j.data || []);
                try { localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(j.data || [])); } catch (_) {}
            }
            if (resMeta.ok && m.success && mounted) {
                const map = {};
                (m.data || []).forEach(opt => {
                    if (!opt || !opt.value) return;
                    if (opt.value.toString().toUpperCase() === 'OTHER') return;
                    if (!map[opt.key]) map[opt.key] = [];
                    if (!map[opt.key].includes(opt.value)) map[opt.key].push(opt.value);
                });
                setMetaOptions(map);
                try { localStorage.setItem(META_CACHE_KEY, JSON.stringify(map)); } catch (_) {}
            }
        } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
}, []);

useEffect(() => {
    let mounted = true;
    (async () => {
        try {
            const url = selectedStoreFilter ? `/api/jewellery?store=${encodeURIComponent(selectedStoreFilter)}` : '/api/jewellery';
            const res = await fetch(url);
            if (!res.ok) return;
            const j = await res.json();
            if (j && j.success && mounted) setJewelleryItems(j.data || []);
        } catch (e) { console.error('Failed to fetch jewellery', e); }
    })();
    return () => { mounted = false; };
}, [selectedStoreFilter, jewelleryMode]);

const getTypesForCategory = (category) => {
    const key = `collectionType_${category.toLowerCase()}`;
    if (metaOptions[key] && metaOptions[key].length) {
        return metaOptions[key].filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    }
    return [];
};

const getOccasionsForCategory = (category) => {
    const key = `occasion_${category.toLowerCase()}`;
    if (metaOptions[key] && metaOptions[key].length) {
        return metaOptions[key].filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    }
    return [];
};

const getChildrenTypesByGroup = () => {
    const boysMeta = (metaOptions['collectionType_children_boys'] || []).filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    const girlsMeta = (metaOptions['collectionType_children_girls'] || []).filter(v => v && v.toString().toUpperCase() !== 'OTHER');
    const final = {
        BOYS: boysMeta,
        GIRLS: girlsMeta,
    };
    return final;
};

useEffect(() => {
    document.body.style.overflow = selectedProduct || showModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
}, [selectedProduct, showModal]);

useEffect(() => {
    if (!openDropdown) return;
    function handleClickOutside(event) {
      if (dropdownsContainerRef.current && !dropdownsContainerRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
}, [openDropdown]);

const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
const currentProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
const handlePageChange = (page) => setCurrentPage(page);
const handleProductClick = (product) => setSelectedProduct(product);
const handleCloseModal = () => setSelectedProduct(null);

const scrollToCollectionTitle = () => {
    if (dropdownsContainerRef.current) {
        try {
            const menus = dropdownsContainerRef.current.querySelectorAll(`.${styles['dropdown-menu']}`);
            menus.forEach(m => {
                // Removing inline style manipulation here, as it conflicts with CSS and state
                // m.style.display = 'none'; 
            });
        } catch (e) { /* ignore DOM errors */ }
    }

    setTimeout(() => {
        if (collectionTitleRef.current) {
            const y = collectionTitleRef.current.getBoundingClientRect().top + window.pageYOffset - 24;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, 60);
};

const handleCategoryClick = (category) => {
    setJewelleryMode(false);
    setActiveCategory(category);
    setActiveType(null);
    setActiveSubcategory(null);
    setActiveOccasion(null);
    setOpenDropdown(null);
    scrollToCollectionTitle();
};

const handleJewelleryClick = () => {
    setJewelleryMode(true);
    setActiveCategory('ALL');
    setActiveType(null);
    setActiveSubcategory(null);
    setActiveOccasion(null);
    setOpenDropdown(null);
    scrollToCollectionTitle();
};

// 🌟🌟🌟 FINAL EDITED FIX: handleCategoryTap 🌟🌟🌟
const handleCategoryTap = (category) => {
    
    // Safety check: Always exit Jewellery Mode when clicking a clothing category
    setJewelleryMode(false); 

    // Mobile logic (<= 768px)
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        
        // Agar yeh dropdown pehle se hi khula hai (i.e., Second Tap)
        if (openDropdown === category) {
            
            // Step 2: Dropdown ko close karo aur Collection load karke scroll karo
            setOpenDropdown(null);
            
            // Collection load logic
            setActiveCategory(category);
            setActiveType(null);
            setActiveSubcategory(null);
            setActiveOccasion(null);

            scrollToCollectionTitle();
            return;
        }
        
        // Agar koi aur dropdown khula hai, toh use pehle band karo
        if (openDropdown && openDropdown !== category) {
             setOpenDropdown(null);
        }

        // Step 1: Naya dropdown kholo (First Tap)
        
        // Clear any lingering inline 'display:none' for smooth opening (Safety)
        if (dropdownsContainerRef.current) {
            try {
                const menus = dropdownsContainerRef.current.querySelectorAll(`.${styles['dropdown-menu']}`);
                menus.forEach(m => { m.style.display = ''; });
            } catch (e) { /* ignore */ }
        }
        
        setOpenDropdown(category);
        
        // Active filters ko reset karo (lekin main category active rahegi)
        setActiveType(null);
        setActiveSubcategory(null);
        setActiveOccasion(null);
        
        return; 
    }
    
    // Desktop: Fallback (single click will run handleCategoryClick)
    handleCategoryClick(category);
};
// 🌟🌟🌟 END FINAL EDITED FIX 🌟🌟🌟

const handleTypeClick = (category, type, subcategory = null) => {
    setJewelleryMode(false);
    setActiveCategory(category);
    setActiveType(type);
    setActiveSubcategory(subcategory);
    setActiveOccasion(null);
    setOpenDropdown(null);
    scrollToCollectionTitle();
};

const handleOccasionClick = (category, occasion, subcategory = null) => {
    setJewelleryMode(false);
    setActiveCategory(category);
    setActiveOccasion(occasion);
    setActiveType(null);
    setActiveSubcategory(subcategory);
    setOpenDropdown(null);
    scrollToCollectionTitle();
};

const openEditor = (category) => {
    setEditorCategory(category);
    setShowMetaEditor(true);
};

const getBreadcrumbs = () => {
    if (jewelleryMode) {
        const store = (selectedStoreFilter || '').toString().trim();
        return store ? store.toUpperCase() : 'ALL STORES';
    }
    const cat = activeCategory || 'ALL';
    if (activeType) {
        if (activeCategory === 'CHILDREN' && activeSubcategory) {
            return `${cat} > ${activeSubcategory} COLLECTION > ${activeType}`.toUpperCase();
        }
        return `${cat} > RENT BY TYPE > ${activeType}`.toUpperCase();
    }
    if (activeOccasion) {
        return `${cat} > RENT BY OCCASION > ${activeOccasion}`.toUpperCase();
    }
    if ((cat || '').toUpperCase() === 'ALL') return 'ALL COLLECTION';
    return cat.toUpperCase();
};

const handleSaveCollection = (savedData, metaData) => {
    setShowModal(false);
    if (metaData && Array.isArray(metaData)) {
        const map = { ...metaOptions };
        metaData.forEach(opt => {
            if (!map[opt.key]) map[opt.key] = [];
            if (!map[opt.key].includes(opt.value)) map[opt.key].push(opt.value);
        });
        setMetaOptions(map);
    }
    if (!savedData) {
        (async () => {
            try {
                const res = await fetch('/api/collections');
                const j = await res.json();
                if (res.ok && j.success) setCollections(j.data || []);
            } catch (e) { console.error(e); }
        })();
        return;
    }
    if (savedData && savedData.isPending) {
        setCollections(prev => {
            const exists = (prev || []).some(c => (c.productId && savedData.productId && c.productId === savedData.productId) || c._id === savedData._id);
            if (exists) return prev;
            const updated = [savedData, ...(prev || [])];
            try { localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(updated)); } catch (_) {}
            return updated;
        });
        return;
    }
    setCollections(prev => {
        const list = prev ? [...prev] : [];
        const matchIndex = list.findIndex(c => {
            if (c._id && c._id.toString().startsWith('pending-') && savedData.productId && c.productId && c.productId === savedData.productId) return true;
            if (c.productId && savedData.productId && c.productId === savedData.productId) return true;
            return false;
        });
        if (matchIndex !== -1) {
            list.splice(matchIndex, 1, savedData);
            const updated = [list[matchIndex], ...list.slice(0, matchIndex), ...list.slice(matchIndex + 1)];
            return updated;
        }
        const filtered = list.filter(c => c._id !== savedData._id);
        const updated = [savedData, ...filtered];
        try { localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(updated)); } catch (_) {}
        return updated;
    });
};

return (
<main>
<section id="collection" className={styles['collection-section']}>
<div className="container">
<h1 className={styles.pageTitle}>Our <span className={styles.highlight}>Collection</span></h1>
<hr className={styles.divider} />
<div 
    ref={dropdownsContainerRef} 
    className={`${styles['category-buttons']} ${openDropdown ? styles['dropdown-open'] : ''}`}
>

{/* ALL button — always visible even in Jewellery mode */}
<div className={`${styles['category-button-container']} ${activeCategory === 'ALL' ? styles.active : ''} ${styles.noHover}`}>
    <button onClick={() => handleCategoryClick('ALL')} className={`${styles.categoryButton} ${styles.noHover}`}>ALL</button>
</div>


{/* MEN button */}
<div className={`${styles['category-button-container']} ${openDropdown === 'MEN' ? styles.open : ''}`}>
<button onClick={() => handleCategoryTap('MEN')} className={styles.categoryButton}>MEN</button>
<div className={styles['dropdown-menu']}>
    {isAdmin && (
        <div style={{ position: 'absolute', right: 12, top: 8 }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor('MEN'); }} style={{ padding: '4px 8px', borderRadius: 6 }}>Edit</button>
        </div>
    )}
{(() => {
    const types = getTypesForCategory('MEN');
    const occ = getOccasionsForCategory('MEN');
    return (
        <>
            {types && types.length > 0 && (
                <div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4>
                    <ul>
                        {types.map(t => (
                            <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', t); }}>{t}</a></li>
                        ))}
                    </ul>
                </div>
            )}
            {occ && occ.length > 0 && (
                <div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4>
                    <ul>
                        {occ.map(o => (
                            <li key={o}><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', o); }}>{o}</a></li>
                        ))}
                    </ul>
                </div>
            )}
            {(!types || types.length === 0) && (!occ || occ.length === 0) && (
                <div style={{ padding: '12px 18px', color: '#888' }}>No types or occasions configured.</div>
            )}
        </>
    );
})()}
</div>
</div>

{/* WOMEN button */}
<div className={`${styles['category-button-container']} ${openDropdown === 'WOMEN' ? styles.open : ''}`}>
<button onClick={() => handleCategoryTap('WOMEN')} className={styles.categoryButton}>WOMEN</button>
<div className={styles['dropdown-menu']}>
    {isAdmin && (
        <div style={{ position: 'absolute', right: 12, top: 8 }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor('WOMEN'); }} style={{ padding: '4px 8px', borderRadius: 6 }}>Edit</button>
        </div>
    )}
{(() => {
    const types = getTypesForCategory('WOMEN');
    const occ = getOccasionsForCategory('WOMEN');
    return (
        <>
            {types && types.length > 0 && (
                <div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4>
                    <ul>
                        {types.map(t => (
                            <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', t); }}>{t}</a></li>
                        ))}
                    </ul>
                </div>
            )}
            {occ && occ.length > 0 && (
                <div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4>
                    <ul>
                        {occ.map(o => (
                            <li key={o}><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', o); }}>{o}</a></li>
                        ))}
                    </ul>
                </div>
            )}
            {(!types || types.length === 0) && (!occ || occ.length === 0) && (
                <div style={{ padding: '12px 18px', color: '#888' }}>No types or occasions configured.</div>
            )}
        </>
    );
})()}
</div>
</div>

{/* CHILDREN button */}
<div className={`${styles['category-button-container']} ${openDropdown === 'CHILDREN' ? styles.open : ''}`}>
<button onClick={() => handleCategoryTap('CHILDREN')} className={styles.categoryButton}>CHILDREN</button>
<div className={styles['dropdown-menu']}>
    {isAdmin && (
        <div style={{ position: 'absolute', right: 12, top: 8 }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditor('CHILDREN'); }} style={{ padding: '4px 8px', borderRadius: 6 }}>Edit</button>
        </div>
    )}
{(() => {
    const groups = getChildrenTypesByGroup();
    return (
        <>
            {groups.BOYS && groups.BOYS.length > 0 && (
                <div className={styles['dropdown-column']}><h4>BOYS</h4>
                    <ul>
                        {groups.BOYS.map(t => <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', t, 'BOYS'); }}>{t}</a></li>)}
                    </ul>
                </div>
            )}
            {groups.GIRLS && groups.GIRLS.length > 0 && (
                <div className={styles['dropdown-column']}><h4>GIRLS</h4>
                    <ul>
                        {groups.GIRLS.map(t => <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', t, 'GIRLS'); }}>{t}</a></li>)}
                    </ul>
                </div>
            )}
            {((!groups.BOYS || groups.BOYS.length === 0) && (!groups.GIRLS || groups.GIRLS.length === 0)) && (
                <div style={{ padding: '12px 18px', color: '#888' }}>No types configured for children.</div>
            )}
        </>
    );
})()}
</div>
</div>

{/* JEWELLERY button */}
<div className={`${styles['category-button-container']} ${jewelleryMode ? styles.active : ''} ${styles.noHover}`}>
    <button onClick={() => handleJewelleryClick()} className={`${styles.categoryButton} ${styles.noHover}`}>JEWELLERY</button>
</div>

</div> 
<div ref={collectionContentRef} className={`${styles['collection-content']} ${openDropdown ? styles['dropdown-active'] : ''}`}>

{(activeCategory || jewelleryMode) && (
    <>
        {(() => {
            const bc = getBreadcrumbs();
            return bc ? <p className={styles.breadcrumbs}>{bc}</p> : null;
        })()}

        <h2 ref={collectionTitleRef} className={styles['collection-title']}>{jewelleryMode ? 'Jewellery Collection' : 'Royal Collection'}</h2>

        <p className={styles['collection-subtitle']}>Explore our finest selection.</p>
    </>
)}

{/* Header action area */}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, alignItems: 'center' }}>
    {(activeCategory || jewelleryMode) && !jewelleryMode && isAdmin && (
        <button onClick={() => { setEditingCollection(null); setShowModal(true); }} style={{ padding: '8px 12px', borderRadius: 6 }}>Add New Collection</button>
    )}

    {jewelleryMode && (
        <>
            <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className={styles.storeFilterSelect}
                style={{ marginRight: 8 }}
            >
                <option value="">All Stores</option>
                {storesList.map(s => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
            </select>
            {isAdmin && (
                <button onClick={() => { setEditingCollection(null); setShowJewelleryModal(true); }} style={{ padding: '8px 12px', borderRadius: 6 }}>Add New Jewellery</button>
            )}
        </>
    )}
</div>

<div className={`${styles['product-grid']} ${styles[viewMode === 'grid' ? 'grid-view' : 'single-column']}`}>
{(!jewelleryMode ? currentProducts : jewelleryItems).map(item => (
    <ProductCard
        key={item._id || item.id}
        product={item}
        isAdmin={isAdmin}
        onProductClick={handleProductClick}
        onEdit={(p) => {
            if (jewelleryMode) {
                setEditingCollection(p);
                setShowJewelleryModal(true);
            } else {
                setEditingCollection(p);
                setShowModal(true);
            }
        }}
        onDelete={async (p) => {
            if (!confirm('Delete this item?')) return;
            try {
                if (jewelleryMode) {
                    const res = await fetch('/api/admin/jewellery', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id: p._id }) });
                    if (res.ok) setJewelleryItems(prev => prev.filter(j => j._id !== p._id));
                    else alert('Failed to delete');
                } else {
                    const res = await fetch(`/api/collections/${p._id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setCollections(prev => {
                            const updated = (prev || []).filter(c => c._id !== p._id);
                            try { localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(updated)); } catch (_) {}
                            return updated;
                        });
                    }
                    else alert('Failed to delete');
                }
            } catch (e) { console.error(e); alert('Failed'); }
        }}
    />
))}
</div>

{/* Empty state message */}
{(activeCategory || jewelleryMode) && !jewelleryMode && currentProducts.length === 0 && (
    <div style={{ textAlign: 'center', padding: '32px 12px', color: '#555' }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No collection found</div>
        <div style={{ fontSize: 14 }}>Try a different type or occasion, or add items from the admin panel.</div>
    </div>
)}

{totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}

</div>

</div>

</section>

<ProductModal product={selectedProduct} onClose={handleCloseModal} />

{showModal && (
<CollectionModal
initial={editingCollection}
onClose={() => setShowModal(false)}
onSaved={handleSaveCollection}
metaOptions={metaOptions}
collections={collections}
/>
)}

{showJewelleryModal && (
    <JewelleryModal
        initial={editingCollection}
        onClose={() => { setShowJewelleryModal(false); setEditingCollection(null); }}
        onSaved={(saved) => {
            setJewelleryItems(prev => {
                if (!saved) return prev;
                const filtered = (prev || []).filter(j => j._id !== saved._id);
                return [saved, ...filtered];
            });
            setShowJewelleryModal(false);
            setEditingCollection(null);
        }}
        stores={storesList}
    />
)}

{showMetaEditor && editorCategory && (
    <CategoryMetaEditor
        category={editorCategory}
        metaMap={metaOptions}
        onClose={() => { setShowMetaEditor(false); setEditorCategory(null); }}
        onSaved={(updated) => setMetaOptions(updated)}
    />
)}

</main>
);

}