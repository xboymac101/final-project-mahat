import React, { useState, useEffect } from 'react';
import styles from'./BookWheel.module.css'; // Make a simple CSS file for the wheel

const books = [
  {
    id: 1,
    img: 'https://prodimage.images-bn.com/pimages/9780316565245_p0_v3_s1200x630.jpg',
    name: 'The Knight and the Moth (B&N Exclusive Edition)',
    author: 'Rachel Gillig'
  },
  {
    id: 2,
    img: 'https://prodimage.images-bn.com/pimages/9781339019036_p0_v1_s1200x630.jpg',
    name: 'Sunrise on the Reaping (A Hunger Games Novel)',
    author: 'Suzanne Collins'
  },
  {
    id: 3,
    img: 'https://prodimage.images-bn.com/pimages/9780593242761_p0_v2_s1200x630.jpg',
    name: 'The Let Them Theory: A Life-Changing Tool',
    author: 'Mel Robbins'
  },
  {
    id: 4,
    img: 'https://prodimage.images-bn.com/pimages/9780593597540_p0_v1_s1200x630.jpg',
    name: 'Remarkably Bright Creatures (B&N Exclusive Edition)',
    author: 'Shelby Van Pelt'
  },
  {
    id: 5,
    img: 'https://prodimage.images-bn.com/pimages/9781728278767_p0_v2_s1200x630.jpg',
    name: 'The Tenant (B&N Exclusive Edition)',
    author: 'Freida McFadden'
  },
  {
    id: 6,
    img: 'https://prodimage.images-bn.com/pimages/9781957635997_p0_v1_s1200x630.jpg',
    name: 'Shield of Sparrows',
    author: 'Devney Perry'
  },
  {
    id: 7,
    img: 'https://prodimage.images-bn.com/pimages/9781957635980_p0_v1_s1200x630.jpg',
    name: 'Lights Out: An Into Darkness Novel',
    author: 'Navessa Allen'
  }
];

function BookWheel() {
  const [start, setStart] = useState(0);
  const visibleCount = 6; // How many books to show at once

  // Auto-slide every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setStart(prev => (prev + 1) % books.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Show only the visible books
  const visibleBooks = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleBooks.push(books[(start + i) % books.length]);
  }

  const prevSlide = () => {
    setStart(prev => (prev - 1 + books.length) % books.length);
  };
  const nextSlide = () => {
    setStart(prev => (prev + 1) % books.length);
  };

  return (
    <div className={styles.sliderWrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Bestsellers</h2>
        <a href="#" className={styles.seeAll}>See All</a>
      </div>
      <div className={styles.carousel}>
        <button className={styles.arrow} onClick={prevSlide}>&lt;</button>
        <div className={styles.booksRow}>
          {visibleBooks.map(book => (
            <div key={book.id} className={styles.bookCard}>
              <img src={book.img} alt={book.name} className={styles.bookImg} />
              <div className={styles.bookName}>{book.name.length > 32 ? book.name.slice(0, 29) + '...' : book.name}</div>
              <div className={styles.bookAuthor}>{book.author}</div>
            </div>
          ))}
        </div>
        <button className={styles.arrow} onClick={nextSlide}>&gt;</button>
      </div>
    </div>
  );
}

export default BookWheel;
