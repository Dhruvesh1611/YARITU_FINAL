'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './collection.module.css';
import Pagination from '../../components/Pagination';
import ProductModal from '../../components/ProductModal';
import { useSession } from 'next-auth/react';
import CollectionModal from '../../components/CollectionModal';
import ProductCard from '../../components/ProductCard';

// Static data is used as a fallback and for initial structure
const allProducts = [
  { id: 1, name: 'Royal Gold Sherwani', category: 'MEN', type: 'SHERVANI', occasion: 'WEDDING', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Sherwani', description: 'men • sherwani' },
  { id: 2, name: 'Classic Black Suit', category: 'MEN', type: 'SUIT', occasion: 'COCKTAIL PARTY', image: 'https://placehold.co/300x349/2a2a2a/ffffff?text=Suit', description: 'men • suit' },
  { id: 3, name: 'Modern Indo-Western', category: 'MEN', type: 'INDO WESTERN', occasion: 'SANGEET', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Indo-Western', description: 'men • indo western' },
  { id: 4, name: 'Navy Formal Blazer', category: 'MEN', type: 'BLAZER', occasion: 'COCKTAIL PARTY', image: 'https://placehold.co/300x349/25334d/ffffff?text=Blazer', description: 'men • blazer' },
  { id: 5, name: 'Elegant Wedding Sherwani', category: 'MEN', type: 'SHERVANI', occasion: 'WEDDING', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Sherwani', description: 'men • sherwani' },
  { id: 6, name: 'Three-Piece Suit', category: 'MEN', type: 'SUIT', occasion: 'PRE WEDDING SHOOT', image: 'https://placehold.co/300x349/2a2a2a/ffffff?text=Suit', description: 'men • suit' },
  { id: 7, name: 'Crimson Red Lehenga', category: 'WOMEN', type: 'LEHENGA', occasion: 'WEDDING', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Lehenga', description: 'women • lehenga' },
  { id: 8, name: 'Midnight Blue Gown', category: 'WOMEN', type: 'GOWN', occasion: 'COCKTAIL PARTY', image: 'https://placehold.co/300x349/25334d/ffffff?text=Gown', description: 'women • gown' },
  { id: 9, name: 'Pastel Saree', category: 'WOMEN', type: 'SAREE', occasion: 'SANGEET', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Saree', description: 'men • saree' },
  { id: 10, name: 'Little Prince Suit', category: 'CHILDREN', type: 'BOYS', occasion: 'BIRTHDAY', image: 'https://placehold.co/300x349/2a2a2a/ffffff?text=Boys+Suit', description: 'children • boys' },
  { id: 11, name: 'Princess Pink Gown', category: 'CHILDREN', type: 'GIRLS', occasion: 'BIRTHDAY', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Girls+Gown', description: 'children • girls' },
  { id: 12, name: 'Floral Indo-Western', category: 'MEN', type: 'INDO WESTERN', occasion: 'SANGEET', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Indo-Western', description: 'men • indo western' },
];

const PRODUCTS_PER_PAGE = 8;

export default function Collection() {
  const [activeCategory, setActiveCategory] = useState('MEN');
  const [activeType, setActiveType] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [activeOccasion, setActiveOccasion] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const { data: session } = useSession();
  const isAdmin = !!(session?.user?.role === 'admin' || session?.user?.isAdmin);
  const [collections, setCollections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [openDropdown, setOpenDropdown] = useState(null);

  const collectionTitleRef = useRef(null);
  const collectionContentRef = useRef(null);
  const searchParams = useSearchParams();

  // On mount, check for ?category=...&type=... or ?occasion=... and apply filters
  useEffect(() => {
    try {
      // First, prefer sessionStorage fallback if available (set by ProductCard on click)
      if (typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('targetCollection');
          if (raw) {
            const obj = JSON.parse(raw);
            if (obj?.category) {
              setActiveCategory(obj.category.toString().toUpperCase());
            }
            if (obj?.type) setActiveType(obj.type.toString().toUpperCase());
            if (obj?.occasion) setActiveOccasion(obj.occasion.toString().toUpperCase());
            sessionStorage.removeItem('targetCollection');
            setTimeout(() => {
              if (collectionTitleRef.current) {
                const y = collectionTitleRef.current.getBoundingClientRect().top + window.pageYOffset - 24;
                window.scrollTo({ top: y, behavior: 'smooth' });
              }
            }, 160);
            return; // already handled
          }
        } catch (e) { /* ignore parse errors */ }
      }

      // Otherwise read search params from the URL
      const cat = searchParams.get('category');
      const type = searchParams.get('type') || searchParams.get('collectionType');
      const occ = searchParams.get('occasion');
      if (cat) {
        const upperCat = cat.toString().toUpperCase();
        setActiveCategory(upperCat);
        if (type) {
          setActiveType(type.toString().toUpperCase());
        } else if (occ) {
          setActiveOccasion(occ.toString().toUpperCase());
        }
        // small delay so filtered products compute and DOM is ready
        setTimeout(() => {
          if (collectionTitleRef.current) {
            const y = collectionTitleRef.current.getBoundingClientRect().top + window.pageYOffset - 24;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 120);
      }
    } catch (e) {
      // ignore if navigation API unavailable
      console.warn('No search params available', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = (collections && collections.length) ? collections : allProducts;
    // Normalize helper
    const normalize = (v) => (v || '').toString().trim().toUpperCase();
    let products = source.filter(p => normalize(p.category) === normalize(activeCategory));
    if (activeSubcategory) {
      const sub = normalize(activeSubcategory);
      products = products.filter(p => (normalize(p.collectionType) === sub) || (normalize(p.type) === sub) || (normalize(p.description).includes(sub)));
    }
    if (activeType) {
      const t = normalize(activeType);
      products = products.filter(p => (normalize(p.collectionType) === t) || (normalize(p.type) === t) || (normalize(p.description).includes(t)) || (normalize(p.title).includes(t)) || (normalize(p.name).includes(t)));
    } else if (activeOccasion) {
      products = products.filter(p => normalize(p.occasion) === normalize(activeOccasion));
    }
    setFilteredProducts(products);
    setCurrentPage(1);
  }, [activeCategory, activeType, activeOccasion, activeSubcategory, collections]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/collections');
        const j = await res.json();
        if (res.ok && j.success && mounted) setCollections(j.data || []);
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    document.body.style.overflow = selectedProduct || showModal ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedProduct, showModal]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleProductClick = (product) => setSelectedProduct(product);
  const handleCloseModal = () => setSelectedProduct(null);

  const scrollToCollectionTitle = () => {
    setTimeout(() => {
      if (collectionTitleRef.current) {
        const y = collectionTitleRef.current.getBoundingClientRect().top + window.pageYOffset - 24;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 60);
  };
  
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setActiveType(null);
    setActiveSubcategory(null);
    setActiveOccasion(null);
    setOpenDropdown(null);
    scrollToCollectionTitle();
  };

  const handleTypeClick = (category, type, subcategory = null) => {
    setActiveCategory(category);
    setActiveType(type);
    setActiveSubcategory(subcategory);
    setActiveOccasion(null);
    setOpenDropdown(null);
    scrollToCollectionTitle();
  };

  const handleOccasionClick = (category, occasion, subcategory = null) => {
    setActiveCategory(category);
    setActiveOccasion(occasion);
    setActiveType(null);
    setActiveSubcategory(subcategory);
    setOpenDropdown(null);
    scrollToCollectionTitle();
  };

  const getBreadcrumbs = () => {
    const parts = [activeCategory];
    if (activeSubcategory) parts.push(activeSubcategory);
    if (activeType) parts.push(activeType);
    else if (activeOccasion) parts.push(activeOccasion);
    return parts.join(' > ').toUpperCase();
  };

  const handleSaveCollection = (savedData) => {
    setShowModal(false);
    (async () => {
      try {
        const res = await fetch('/api/collections');
        const j = await res.json();
        if (res.ok && j.success) setCollections(j.data || []);
      } catch (e) { console.error(e); }
    })();
  };

  return (
    <main>
      <section id="collection" className={styles['collection-section']}>
        <div className="container">
          <h1 className={styles.pageTitle}>Our <span className={styles.highlight}>Collection</span></h1>
          <hr className={styles.divider} />
          <div className={`${styles['category-buttons']} ${openDropdown ? styles['dropdown-open'] : ''}`}>
            <div className={`${styles['category-button-container']} ${openDropdown === 'MEN' ? styles.open : ''}`}>
              <button onClick={() => handleCategoryClick('MEN')} className={styles.categoryButton}>MEN</button>
              <div className={styles['dropdown-menu']}>
                <div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', 'SHERVANI'); }}>SHERVANI</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', 'INDO WESTERN'); }}>INDO WESTERN</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', 'SUIT'); }}>SUIT</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', 'BLAZER'); }}>BLAZER</a></li></ul></div>
                <div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', 'WEDDING'); }}>WEDDING</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', 'PRE WEDDING SHOOT'); }}>PRE WEDDING SHOOT</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', 'SANGEET'); }}>SANGEET</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', 'COCKTAIL PARTY'); }}>COCKTAIL PARTY</a></li></ul></div>
              </div>
            </div>
            <div className={`${styles['category-button-container']} ${openDropdown === 'WOMEN' ? styles.open : ''}`}>
              <button onClick={() => handleCategoryClick('WOMEN')} className={styles.categoryButton}>WOMEN</button>
              <div className={styles['dropdown-menu']}>
                <div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', 'LEHENGA'); }}>LEHENGA</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', 'GOWN'); }}>GOWN</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', 'INDO WESTERN'); }}>INDO WESTERN</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', 'SAREE'); }}>SAREE</a></li></ul></div>
                <div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', 'WEDDING'); }}>WEDDING</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', 'PRE WEDDING SHOOT'); }}>PRE WEDDING SHOOT</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', 'SANGEET'); }}>SANGEET</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', 'COCKTAIL PARTY'); }}>COCKTAIL PARTY</a></li></ul></div>
              </div>
            </div>
            <div className={`${styles['category-button-container']} ${openDropdown === 'CHILDREN' ? styles.open : ''}`}>
              <button onClick={() => handleCategoryClick('CHILDREN')} className={styles.categoryButton}>CHILDREN</button>
              <div className={styles['dropdown-menu']}>
                <div className={styles['dropdown-column']}><h4>BOYS<br/>COLLECTION</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'SUIT', 'BOYS'); }}>SUIT</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'KOTI', 'BOYS'); }}>KOTI</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'SHIRT-PENT', 'BOYS'); }}>SHIRT-PENT</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'DHOTI', 'BOYS'); }}>DHOTI</a></li></ul></div>
                <div className={styles['dropdown-column']}><h4>GIRLS<br/> COLLECTION</h4><ul><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'FROCK', 'GIRLS'); }}>FROCK</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'LEHENGA', 'GIRLS'); }}>LEHENGA</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'GOWN', 'GIRLS'); }}>GOWN</a></li><li><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', 'SAREE', 'GIRLS'); }}>ANARKALI SUITS</a></li></ul></div>
              </div>
            </div>
          </div>

          <div ref={collectionContentRef} className={`${styles['collection-content']} ${openDropdown ? styles['dropdown-active'] : ''}`}>
            <p className={styles.breadcrumbs}>{getBreadcrumbs()}</p>
            <h2 ref={collectionTitleRef} className={styles['collection-title']}>Royal Collection</h2>
            <p className={styles['collection-subtitle']}>Explore our finest selection.</p>

            {isAdmin && (<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}><button onClick={() => { setEditingCollection(null); setShowModal(true); }} style={{ padding: '8px 12px', borderRadius: 6 }}>Add New Collection</button></div>)}

            <div className={`${styles['product-grid']} ${styles[viewMode === 'grid' ? 'grid-view' : 'single-column']}`}>
              {currentProducts.map(product => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  isAdmin={isAdmin}
                  onProductClick={handleProductClick}
                  onEdit={(p) => { setEditingCollection(p); setShowModal(true); }}
                  onDelete={async (p) => {
                    if (!confirm('Delete this collection?')) return;
                    try {
                      const res = await fetch(`/api/collections/${p._id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setCollections(prev => prev.filter(c => c._id !== p._id));
                      } else { alert('Failed to delete'); }
                    } catch (e) { console.error(e); alert('Failed'); }
                  }}
                />
              ))}
            </div>
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
        />
      )}
    </main>
  );
}