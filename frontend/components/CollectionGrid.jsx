import React from 'react';
import Image from 'next/image';
import styles from '../app/collection/collection.module.css';

export default function CollectionGrid({ products, columns = 3, onProductClick }) {
  const colsClass = `cols-${columns}`;

  return (
    <div className={`${styles['product-grid']} ${styles['grid-view']} ${styles[colsClass]}`}>
      {products.map((product) => (
        <article className={styles['product-card']} key={product.id} onClick={() => onProductClick(product)}>
          <Image src={product.image} alt={product.name} className={styles['product-image']} width={300} height={349} unoptimized={true} loading="lazy" />
          <div className={styles['card-info']}>
            <p>{product.name}<br />{product.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
