'use client';

import React, { useState, useEffect, useRef } from 'react';

import styles from './collection.module.css';

import Pagination from '../../components/Pagination';

import ProductModal from '../../components/ProductModal';

import { useSession } from 'next-auth/react';

import CollectionModal from '../../components/CollectionModal';
import JewelleryModal from '../../components/JewelleryModal';

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
const [jewelleryMode, setJewelleryMode] = useState(false);
const [jewelleryItems, setJewelleryItems] = useState([]);
const [selectedStoreFilter, setSelectedStoreFilter] = useState('');
const [storesList, setStoresList] = useState([]);
const [metaOptions, setMetaOptions] = useState({});

const [showModal, setShowModal] = useState(false);

const [editingCollection, setEditingCollection] = useState(null);
	const [showJewelleryModal, setShowJewelleryModal] = useState(false);

const [currentPage, setCurrentPage] = useState(1);

const [selectedProduct, setSelectedProduct] = useState(null);

const [viewMode, setViewMode] = useState('grid');

const [openDropdown, setOpenDropdown] = useState(null);



const collectionTitleRef = useRef(null);

const collectionContentRef = useRef(null);



useEffect(() => {

const source = (collections && collections.length) ? collections : allProducts;

let products = [];

if (activeCategory === 'ALL') {

products = source.slice();

} else {

products = source.filter(p => (p.category || '').toUpperCase() === activeCategory);

}

if (activeSubcategory) {

const sub = activeSubcategory.toUpperCase();

products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === sub) || ((p.description||'').toUpperCase().includes(sub)));

}

																// filtering only — no network calls here

								if (activeType) {
									const t = activeType.toUpperCase();
									products = products.filter(p => ((p.collectionType || p.type || '').toUpperCase() === t) || ((p.description||'').toUpperCase().includes(t)) || ((p.title||p.name||'').toUpperCase().includes(t)));
								} else if (activeOccasion) {
									products = products.filter(p => (p.occasion || '').toUpperCase() === activeOccasion.toUpperCase());
								}

setFilteredProducts(products);

setCurrentPage(1);

}, [activeCategory, activeType, activeOccasion, activeSubcategory, collections]);



useEffect(() => {

	let mounted = true;

	(async () => {
		try {
			const [resCollections, resMeta] = await Promise.all([
				fetch('/api/collections'),
				fetch('/api/meta-options')
			]);

			// fetch stores for store filter dropdown (home page uses same /api/stores)
			try {
				const rs = await fetch('/api/stores');
				if (rs.ok) {
					const js = await rs.json();
					if (js && js.success) setStoresList(js.data || []);
				}
			} catch (e) { console.error('Failed to fetch stores', e); }

			// also fetch jewellery list (public)
			try {
				const rj = await fetch('/api/jewellery');
				if (rj.ok) {
					const jj = await rj.json();
					if (jj.success) setJewelleryItems(jj.data || []);
				}
			} catch (_) {}

			const j = await resCollections.json();
			const m = await resMeta.json();
			if (resCollections.ok && j.success && mounted) setCollections(j.data || []);
			if (resMeta.ok && m.success && mounted) {
				const map = {};
				(m.data || []).forEach(opt => {
					// skip placeholder/literal 'OTHER' entries (case-insensitive)
					if (!opt || !opt.value) return;
					if (opt.value.toString().toUpperCase() === 'OTHER') return;
					if (!map[opt.key]) map[opt.key] = [];
					if (!map[opt.key].includes(opt.value)) map[opt.key].push(opt.value);
				});
				setMetaOptions(map);
			}
		} catch (e) { console.error(e); }
	})();

	return () => { mounted = false; };

}, []);

// refetch jewellery when store filter or jewellery mode changes
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

// Helper: get collection types for a category (from metaOptions or fallback)
const getTypesForCategory = (category) => {
	const key = `collectionType_${category.toLowerCase()}`;
	if (metaOptions[key] && metaOptions[key].length) {
		// filter out literal OTHER values and normalize
		return metaOptions[key].filter(v => v && v.toString().toUpperCase() !== 'OTHER');
	}
	// fallback defaults
	if (category === 'MEN') return ['SHERVANI','INDO WESTERN','SUIT','BLAZER'];
	if (category === 'WOMEN') return ['SARI','LEHENGA','GOWN'];
	return [];
};

// Helper: get occasions for a category
const getOccasionsForCategory = (category) => {
	const key = `occasion_${category.toLowerCase()}`;
	if (metaOptions[key] && metaOptions[key].length) {
		return metaOptions[key].filter(v => v && v.toString().toUpperCase() !== 'OTHER');
	}
	if (category === 'MEN') return ['WEDDING','PRE WEDDING SHOOT','SANGEET','COCKTAIL PARTY'];
	if (category === 'WOMEN') return ['WEDDING','PRE WEDDING SHOOT','SANGEET','COCKTAIL PARTY'];
	if (category === 'CHILDREN') return ['BIRTHDAY','FESTIVAL','WEDDING'];
	return [];
};

// Helper: derive children types grouped by childCategory (BOYS/GIRLS) from saved collections
const getChildrenTypesByGroup = () => {
    const groups = { BOYS: [], GIRLS: [] };
    collections.forEach(c => {
        if ((c.category || '').toUpperCase() === 'CHILDREN') {
            const group = (c.childCategory || c.collectionGroup || '').toString().toUpperCase();
            const type = (c.collectionType || '').toString().toUpperCase();
            if (group && type && type !== 'OTHER') {
                if (!groups[group]) groups[group] = [];
                if (!groups[group].includes(type)) groups[group].push(type);
            }
        }
    });
    // fallbacks if empty
    if (!groups.BOYS.length) groups.BOYS = ['SUIT','KOTI','SHIRT-PENT','DHOTI'];
    if (!groups.GIRLS.length) groups.GIRLS = ['FROCK','LEHENGA','GOWN','ANARKALI SUITS'];
    return groups;
};



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

	setJewelleryMode(false); // entering a clothing category should exit jewellery mode
setActiveCategory(category);

setActiveType(null);

setActiveSubcategory(null);

setActiveOccasion(null);

setOpenDropdown(null);

scrollToCollectionTitle();

};

const handleJewelleryClick = () => {
	// enter jewellery section
	setJewelleryMode(true);
	setActiveCategory('ALL');
	setActiveType(null);
	setActiveSubcategory(null);
	setActiveOccasion(null);
	setOpenDropdown(null);
	scrollToCollectionTitle();
};

// Mobile two-step tap behavior:
// 1) first tap opens the dropdown card for the category (shows Rent by Type / Occasion)
// 2) second tap on the same button closes the card and scrolls to the collection content
const handleCategoryTap = (category) => {
	if (typeof window !== 'undefined' && window.innerWidth <= 768) {
		// if the dropdown for this category isn't open yet, open it (don't navigate)
		if (openDropdown !== category) {
			setOpenDropdown(category);
			return;
		}
		// second tap: close dropdown and navigate to the collection
		setOpenDropdown(null);
		setActiveCategory(category);
		setActiveType(null);
		setActiveSubcategory(null);
		setActiveOccasion(null);
		// give the layout a moment (close animation) then scroll
		setTimeout(() => scrollToCollectionTitle(), 80);
		return;
	}
	// Desktop: behave as normal
	handleCategoryClick(category);
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
	// Build breadcrumbs that reflect the filter type so it reads like:
	// MEN > RENT BY OCCASION > WEDDING
	// MEN > RENT BY TYPE > SHERVANI
	const cat = activeCategory || 'ALL';
	if (activeType) {
		// For children, if there's a subgroup (BOYS/GIRLS), show it
		if (activeCategory === 'CHILDREN' && activeSubcategory) {
			return `${cat} > ${activeSubcategory} COLLECTION > ${activeType}`.toUpperCase();
		}
		return `${cat} > RENT BY TYPE > ${activeType}`.toUpperCase();
	}
	if (activeOccasion) {
		return `${cat} > RENT BY OCCASION > ${activeOccasion}`.toUpperCase();
	}
	// default breadcrumb
	return cat.toUpperCase();

};



const handleSaveCollection = (savedData, metaData) => {

	setShowModal(false);

	// If the modal returned updated meta-options, merge them into state so dropdowns refresh immediately
	if (metaData && Array.isArray(metaData)) {
		const map = { ...metaOptions };
		metaData.forEach(opt => {
			if (!map[opt.key]) map[opt.key] = [];
			if (!map[opt.key].includes(opt.value)) map[opt.key].push(opt.value);
		});
		setMetaOptions(map);
	}

	// Optimistically add/update the saved collection in the list so UI reflects changes immediately
	if (savedData && savedData._id) {
		setCollections(prev => {
			const filtered = (prev || []).filter(c => c._id !== savedData._id);
			return [savedData, ...filtered];
		});
		return;
	}

	// Fallback: re-fetch collections from server
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
{/* header controls: store filter + add button will be shown in the header area below when jewelleryMode is active */}

<div className={`${styles['category-buttons']} ${openDropdown ? styles['dropdown-open'] : ''}`}>

<div className={`${styles['category-button-container']} ${activeCategory === 'ALL' ? styles.active : ''} ${styles.noHover}`}>

<button onClick={() => handleCategoryClick('ALL')} className={`${styles.categoryButton} ${styles.noHover}`}>ALL</button>

</div>



<div className={`${styles['category-button-container']} ${openDropdown === 'MEN' ? styles.open : ''}`}>

<button onClick={() => handleCategoryTap('MEN')} className={styles.categoryButton}>MEN</button>

<div className={styles['dropdown-menu']}>

{(() => {
	const types = getTypesForCategory('MEN');
	const occ = getOccasionsForCategory('MEN');
	return (
		<>
			<div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4>
				<ul>
					{types.map(t => (
						<li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('MEN', t); }}>{t}</a></li>
					))}
				</ul>
			</div>
			<div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4>
				<ul>
					{occ.map(o => (
						<li key={o}><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('MEN', o); }}>{o}</a></li>
					))}
				</ul>
			</div>
		</>
	);
})()}

</div>

</div>

<div className={`${styles['category-button-container']} ${openDropdown === 'WOMEN' ? styles.open : ''}`}>

<button onClick={() => handleCategoryTap('WOMEN')} className={styles.categoryButton}>WOMEN</button>

<div className={styles['dropdown-menu']}>

{(() => {
	const types = getTypesForCategory('WOMEN');
	const occ = getOccasionsForCategory('WOMEN');
	return (
		<>
			<div className={styles['dropdown-column']}><h4>RENT BY TYPE</h4>
				<ul>
					{types.map(t => (
						<li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('WOMEN', t); }}>{t}</a></li>
					))}
				</ul>
			</div>
			<div className={styles['dropdown-column']}><h4>RENT BY OCCASION</h4>
				<ul>
					{occ.map(o => (
						<li key={o}><a href="#" onClick={(e) => { e.preventDefault(); handleOccasionClick('WOMEN', o); }}>{o}</a></li>
					))}
				</ul>
			</div>
		</>
	);
})()}

</div>

</div>

<div className={`${styles['category-button-container']} ${openDropdown === 'CHILDREN' ? styles.open : ''}`}>

<button onClick={() => handleCategoryTap('CHILDREN')} className={styles.categoryButton}>CHILDREN</button>

<div className={styles['dropdown-menu']}>

{(() => {
	const groups = getChildrenTypesByGroup();
	return (
		<>
			<div className={styles['dropdown-column']}><h4>BOYS<br/>COLLECTION</h4>
				<ul>
					{groups.BOYS.map(t => <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', t, 'BOYS'); }}>{t}</a></li>)}
				</ul>
			</div>
			<div className={styles['dropdown-column']}><h4>GIRLS<br/> COLLECTION</h4>
				<ul>
					{groups.GIRLS.map(t => <li key={t}><a href="#" onClick={(e) => { e.preventDefault(); handleTypeClick('CHILDREN', t, 'GIRLS'); }}>{t}</a></li>)}
				</ul>
			</div>
		</>
	);
})()}

</div>

</div>

<div className={`${styles['category-button-container']} ${jewelleryMode ? styles.active : ''} ${styles.noHover}`}>
	<button onClick={() => handleJewelleryClick()} className={`${styles.categoryButton} ${styles.noHover}`}>JEWELLERY</button>
</div>

</div>



<div ref={collectionContentRef} className={`${styles['collection-content']} ${openDropdown ? styles['dropdown-active'] : ''}`}>

<p className={styles.breadcrumbs}>{getBreadcrumbs()}</p>

<h2 ref={collectionTitleRef} className={styles['collection-title']}>Royal Collection</h2>

<p className={styles['collection-subtitle']}>Explore our finest selection.</p>



{/* Header action area: show collection-add for clothing, or store filter + jewellery-add when in jewellery mode */}
<div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, alignItems: 'center' }}>
	{!jewelleryMode && isAdmin && (
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
				// pass initial to JewelleryModal by opening it with editing data
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
					if (res.ok) setCollections(prev => prev.filter(c => c._id !== p._id));
					else alert('Failed to delete');
				}
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
metaOptions={metaOptions}
collections={collections}

/>

)}

{showJewelleryModal && (
	<JewelleryModal
		initial={editingCollection}
		onClose={() => { setShowJewelleryModal(false); setEditingCollection(null); }}
		onSaved={(saved) => {
			// add/update in list
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

</main>

);

}