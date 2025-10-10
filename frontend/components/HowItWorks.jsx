// components/HowItWorks.jsx

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './HowItWorks.module.css';

// Har step ka data
// Icons are referenced by name and rendered via the Icon component (yellow fill)
const stepsData = [
  {
    title: 'Select Your Style',
    description: 'Browse our exquisite collection of traditional and contemporary designs. Each piece is carefully curated to reflect elegance and sophistication.',
    imgSrc: '/images/step1.png', // Aapki images ka path
    icon: 'gem',
  },
  {
    title: 'Visit Our Showroom',
    description: 'Experience our luxurious showrooms with traditional architecture and personalized service. Our experts will help you find the perfect outfit.',
    imgSrc: '/images/step2.png',
    icon: 'location',
  },
  {
    title: 'Experience Luxury',
    description: 'Enjoy the perfect fit and exquisite craftsmanship. Our garments are designed to make every moment special and memorable.',
    imgSrc: '/images/step3.png',
    icon: 'star',
  },
  {
    title: 'Hassle-free Returns',
    description: 'Complete satisfaction guaranteed. Our flexible return policy ensures you’re completely happy with your purchase.',
    imgSrc: '/images/step4.png',
    icon: 'return',
  },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef([]);

  useEffect(() => {
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
        rootMargin: '-50% 0px -50% 0px', 
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
  }, []); 

  // Simple inline icon renderer — all icons use a yellow/gold fill
  const Icon = ({ name, size = 24 }) => {
    const fill = '#F7C948'; // warm yellow/gold
    const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
    switch (name) {
      case 'tshirt':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M3 7l3-2 2 1 2-1 2 1 2-1 2 1 3 2v9a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2V7z" fill={fill} />
          </svg>
        );
      case 'palette':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M12 3a9 9 0 1 0 9 9c0-4.97-4.03-9-9-9zm-1 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" fill={fill} />
          </svg>
        );
      case 'sparkles':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M12 2l1.5 3 3 .5-3 1-1.5 3-1.5-3-3-1 .5-3L12 2z" fill={fill} />
            <path d="M5 15l.7 1.4L7 17l-1.3.6L5 19 4.3 17.6 3 17l1.7-.6L5 15z" fill={fill} />
          </svg>
        );
      case 'gem':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M12 2l3 6 6 1-6 4-3 7-3-7-6-4 6-1 3-6z" fill={fill} />
            <path d="M12 2l-2 4-4 1 4 2 2 5 2-5 4-2-4-1-2-4z" fill="#FCEABB" opacity="0.1" />
          </svg>
        );
      case 'location':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" fill={fill} />
          </svg>
        );
      case 'star':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill={fill} />
          </svg>
        );
      case 'return':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M20 7v6h-6" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 13a7 7 0 1 1-7-7H4" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.mainContainer}>
      <h2 className={styles.mainHeading}>HOW YARITU WORKS</h2>
      <div className={styles.contentWrapper}>
        
        {/* === LEFT (STICKY) COLUMN: Image Display === */}
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
                    // --- YEH BADLAAV KIYA GAYA HAI ---
                    style={{ objectFit: "fill" }} // 'objectFit' ko 'style' prop mein daala
                  />
                </div>
              ))}
            </div>
            {/* इमेज स्टैंड्स */}
            <div className={styles.frameStands}>
              <div className={styles.stand}></div>
              <div className={styles.stand}></div>
            </div>
          </div>
        </div>

        {/* === RIGHT (SCROLLING) COLUMN: Timeline === */}
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
                  {/* Dot sirf non-active state mein dikhega */}
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