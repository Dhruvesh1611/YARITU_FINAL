'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from './collection.module.css';
import Image from 'next/image';
import Pagination from '../../components/Pagination';
import ProductModal from '../../components/ProductModal';
import { useSession } from 'next-auth/react';
import CollectionModal from '../../components/CollectionModal';

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
  { id: 9, name: 'Pastel Saree', category: 'WOMEN', type: 'SAREE', occasion: 'SANGEET', image: 'https://placehold.co/300x349/c5a46d/25334d?text=Saree', description: 'women • saree' },
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

  // This useEffect is from your original code to maintain UI logic
  useEffect(() => {
    const source = (collections && collections.length) ? collections : allProducts;
    let products = source.filter(p => (p.category || '').toUpperCase() === activeCategory);
    if (activeSubcategory) {
      const sub = activeSubcategory.toUpperCase();
      products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === sub) || ((p.description||'').toUpperCase().includes(sub)));
    }
    if (activeType) {
      const t = activeType.toUpperCase();
      products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === t) || ((p.description||'').toUpperCase().includes(t)) || ((p.title||p.name||'').toUpperCase().includes(t)));
    } else if (activeOccasion) {
      products = products.filter(p => (p.occasion || '').toUpperCase() === activeOccasion.toUpperCase());
    }
    setFilteredProducts(products);
    setCurrentPage(1);
  }, [activeCategory, activeType, activeOccasion, activeSubcategory, collections]); // Added collections to dependency array

  // load collections
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

  // Body scroll logic
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
  
  // All your click handlers remain the same to preserve UI behavior
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
    setCollections(prev => {
      const exists = prev.some(c => c._id === savedData._id);
      if (exists) {
        return prev.map(c => (c._id === savedData._id ? savedData : c));
      }
      return [savedData, ...prev];
    });
    setShowModal(false);
  };

  return (
    <main>
      <section id="collection" className={styles['collection-section']}>
        <div className="container">
          <h1 className={styles.pageTitle}>Our <span className={styles.highlight}>Collection</span></h1>
          <hr className={styles.divider} />

          {/* All your JSX for filters is unchanged */}
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
              {currentProducts.map(product => {
                // *** THE ONLY FIX IS HERE - THIS DOES NOT CHANGE THE UI ***
                const imageUrl = product.mainImage || product.image || '/placeholder.png';
                const title = product.title || product.name;
                const description = product.description || '';

                return (
                  <article className={styles['product-card']} key={product._id || product.id}>
                    <div className={styles['product-image-wrapper']}> 
                      <Image
                        src={imageUrl}
                        alt={title || 'Collection item'}
                        className={styles['product-image']}
                        width={300}
                        height={349}
                        unoptimized={true}
                        priority
                        onClick={() => handleProductClick({ ...product, image: imageUrl, name: title, images: [imageUrl].filter(Boolean) })}
                      />
                    </div>
                    <div className={styles['card-info']}>
                      <p>{title}<br />{description}</p>
                      {isAdmin && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditingCollection(product); setShowModal(true); }} style={{ padding: '6px 8px' }}>Edit</button>
                          <button onClick={async () => {
                            if (!confirm('Delete this collection?')) return;
                            try {
                              const res = await fetch(`/api/collections/${product._id}`,{ method: 'DELETE' });
                              if (res.ok) {
                                setCollections(prev => prev.filter(c => c._id !== product._id));
                              } else { alert('Failed to delete'); }
                            } catch (e) { console.error(e); alert('Failed'); }
                          }} style={{ padding: '6px 8px', background: '#b91c1c', color: '#fff', border: 'none' }}>Delete</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
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