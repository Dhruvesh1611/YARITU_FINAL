// components/Header.js

'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';
import { usePathname } from 'next/navigation';
import { useUI } from '../contexts/UIProvider'; // Import the hook
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { isMenuOpen, toggleMenu, closeMenu } = useUI(); // Use the context
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);
  
  // 🔥 FIX 1: Body Overflow Control (Flicker Fix)
  useEffect(() => {
    if (isMenuOpen) {
        // Menu open hone par body scrolling band (flicker rokne ke liye)
        document.body.style.overflow = 'hidden';
    } else {
        // Menu close hone par body scrolling chalu
        document.body.style.overflow = 'unset';
    }

    // Cleanup: Component unmount hone par style hatana
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);
  // ----------------------------------------------------

  // Helper function to create dynamic class names
  const navLinkClass = (path) => {
    return `${styles.navLink} ${pathname === path ? styles.active : ''}`;
  };

  return (
    <>
      <header className={`${styles.mainHeader} ${isScrolled ? styles.scrolled : ''}`}>
          <nav className={styles.mainNav}>
              <div className={styles.navCenter}>
                  <div className={styles.navGroup}>
                      <Link href="/" className={navLinkClass('/')}>Home</Link>
                      <Link href="/collection" className={navLinkClass('/collection')}>Collections</Link>
                  </div>

{/* 🔥 SEO/Performance Fix: sizes='160px' set kiya hai (desktop width) */}
<Link href="/" className={styles.navLogo}>
  <Image
    src="/images/yaritu_logo_black.png"
    alt="Yaritu Logo"
    fill
    priority // Good for LCP/SEO, isko rehne diya
    sizes="(max-width: 480px) 100px, 160px" // Mobile par 100px, Desktop par 160px. Yeh '600px' se zyada achha hai.
    style={{ objectFit: 'contain' }}
  />
</Link>
                  <div className={styles.navGroup}>
                      <Link href="/about" className={navLinkClass('/about')}>About</Link>
                      <Link href="/contact" className={navLinkClass('/contact')}>Contact</Link>
                      <Link href="/review" className={navLinkClass('/review')}>Reviews</Link>
                      {session && (
                        <button onClick={() => signOut()} className={styles.navLink}>Logout</button>
                      )}
                  </div>
              </div>
              <Link href="/offer" className={styles.navOffers}>
                  <Image src="/images/gift.svg" alt="Hot Sale Icon" className={styles.offerIcon} width={30} height={30} />
                  <span>OFFERS</span>
              </Link>

              <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle menu">
                  <div className={`${styles.hamburgerBox} ${isMenuOpen ? styles.open : ''}`}>
                      <div className={styles.hamburgerInner}></div>
                  </div>
              </button>
          </nav>
      </header>

      {/* Mobile Nav */}
      <div className={`${styles.mobileNav} ${isMenuOpen ? styles.open : ''}`}>
          <div className={styles.mobileLogoWrap}>
           <Link href="/" onClick={closeMenu}> {/* Menu band karne ke liye onClick add kiya */}
             {/* Mobile Logo: Fixed width/height, toh fill prop ki zarurat nahi */}
             <Image src="/images/yaritu_logo_black.png" alt="Yaritu" width={90} height={66} style={{ width: 'auto', height: 'auto' }} />
           </Link>
         </div>
         {/* Saare mobile links par closeMenu add kiya */}
         <Link href="/" className={styles.mobileNavLink} onClick={closeMenu}>Home</Link>
          <Link href="/collection" className={styles.mobileNavLink} onClick={closeMenu}>Collections</Link>
          <Link href="/about" className={styles.mobileNavLink} onClick={closeMenu}>About</Link>
          <Link href="/contact" className={styles.mobileNavLink} onClick={closeMenu}>Contact</Link>
          <Link href="/review" className={styles.mobileNavLink} onClick={closeMenu}>Reviews</Link>
          <Link href="/offer" className={styles.mobileNavLink} onClick={closeMenu}>Offers</Link>
          {session && (
            <button onClick={() => { signOut(); closeMenu(); }} className={styles.mobileNavLink}>Logout</button>
          )}
      </div>
      {isMenuOpen && <div className={styles.overlay} onClick={closeMenu}></div>}
    </>
  );
}