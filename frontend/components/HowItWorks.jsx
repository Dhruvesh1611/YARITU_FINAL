// components/HowItWorks.jsx

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './HowItWorks.module.css';

// Har step ka data (Isme koi change nahi hai)
const stepsData = [
  {
    title: 'Visit Our Showroom',
    description: 'Browse our exquisite collection of traditional and contemporary designs. Each piecStep into your nearest Yaritu Showroom and explore our exclusive range of rental outfits for every occasion. Our team helps you find the perfect fit for your style and budget.',
    imgSrc: '/images/step1.png',
    icon: 'gem',
  },
  {
    title: 'Select Your Outfit',
    description: 'Choose from our wide collection of designer lehengas, sherwanis, gowns, suits and more. Try them on to find your dream look for weddings, parties, or special events.',
    imgSrc: '/images/step2.png',
    icon: 'location',
  },
  {
    title: 'Shine at Your Function',
    description: 'Wear your selected outfit and make a statement at your event. Be confident, stylish, and picture-perfect while enjoying your special moments.',
    imgSrc: '/images/step3.png',
    icon: 'star',
  },
  {
    title: 'Return with Ease',
    description: 'After your event, simply return the outfit to our showroom. We take care of cleaning and maintenance—hassle-free and convenient for you.',
    imgSrc: '/images/step4.png',
    icon: 'return',
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);
  
  // === 1. YEH NAYA STATE ADD KIYA GAYA HAI ===
  // Yeh check karega ki view mobile hai ya nahi
  const [isMobile, setIsMobile] = useState(false);

  // === 2. SCREEN SIZE CHECK KARNE KE LIYE YEH NAYA useEffect ADD KIYA GAYA HAI ===
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Component load hone par check karega
    checkScreenSize();

    // Window resize hone par check karega
    window.addEventListener('resize', checkScreenSize);

    // Cleanup function
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  useEffect(() => {
    // === 3. rootMargin KO AB CONDITIONALLY SET KIYA GAYA HAI ===
    // Agar mobile hai, toh trigger point neeche rakhenge.
    // Agar desktop hai, toh trigger point upar rakhenge.
    const rootMargin = isMobile ? '0px 0px -40% 0px' : '0px 0px -70% 0px';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const stepIndex = parseInt(entry.target.dataset.index, 10);
            setActiveStep(stepIndex);
          }
        });
      },
      {
        root: null,
        rootMargin: rootMargin, // Yahan dynamic value use ki hai
        threshold: 0,
      }
    );

    const currentRefs = stepRefs.current;
    currentRefs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [isMobile]); // Dependency array me 'isMobile' add kiya gaya hai

  // Icon component (Isme koi change nahi hai)
  const Icon = ({ name, size = 24 }) => {
    const fill = '#F7C948';
    const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
    switch (name) {
      case 'gem': return ( <svg {...common}><path d="M12 2l3 6 6 1-6 4-3 7-3-7-6-4 6-1 3-6z" fill={fill} /><path d="M12 2l-2 4-4 1 4 2 2 5 2-5 4-2-4-1-2-4z" fill="#FCEABB" opacity="0.1" /></svg> );
      case 'location': return ( <svg {...common}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" fill={fill} /></svg> );
      case 'star': return ( <svg {...common}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={fill} /></svg> );
      case 'return': return ( <svg {...common}><path d="M20 7v6h-6" stroke={fill} strokeWidth="1.5" /><path d="M20 13a7 7 0 1 1-7-7H4" stroke={fill} strokeWidth="1.5" /></svg> );
      default: return null;
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h2 className={styles.mainHeading}>HOW YARITU WORKS</h2>
      <div className={styles.contentWrapper}>
        
        {/* Left (Sticky) Column */}
        <div className={styles.leftStickyColumn}>
          <div className={styles.imageContainer}>
            <div className={styles.imageFrameWrapper}>
              {stepsData.map((step, index) => (
                <div
                  key={index}
                  className={`${styles.imageFrame} ${
                    activeStep === index ? styles.visible : styles.hidden
                  }`}
                >
                  <Image
                    src={step.imgSrc}
                    alt={step.title}
                    width={450} 
                    height={394}
                    priority={index === 0}
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
            <div className={styles.frameStands}>
              <div className={styles.stand}></div>
              <div className={styles.stand}></div>
            </div>
          </div>
        </div>

        {/* Right (Scrolling) Column */}
        <div className={styles.rightScrollingColumn}>
          <div className={styles.timeline}>
            {stepsData.map((step, index) => (
              <div
                key={index}
                ref={(el) => (stepRefs.current[index] = el)} 
                data-index={index}
                className={`${styles.timelineItem} ${activeStep === index ? styles.active : ''}`}
              >
                <div className={styles.timelineNumberWrapper}>
                  <div className={styles.timelineDot}></div> 
                  <div className={styles.timelineNumber}>{index + 1}</div>
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.icon}><Icon name={step.icon} size={28} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;