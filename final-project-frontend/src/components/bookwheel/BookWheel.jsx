import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './BookWheel.module.css';

function BookWheel({ books = [] }) {
  const [start, setStart] = useState(0);
  const visibleCount = 6;

  if (!books || books.length === 0) return null; // Don't render if no books

  const visibleBooks = [];
  for (let i = 0; i < visibleCount && books.length > 0; i++) {
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
        <Link to="/books" className={styles.seeAll}>See All</Link>
      </div>
      <div className={styles.carousel}>
        <button className={styles.arrow} onClick={prevSlide}>&lt;</button>
        <div className={styles.booksRow}>
          {visibleBooks.map(book => (
            <Link to={`/book/${book.book_id}`} key={book.book_id} style={{ textDecoration: "none", color: "inherit" }}>
              <div className={styles.bookCard}>
                <img src={book.img} alt={book.title} className={styles.bookImg} />
                <div className={styles.bookName}>
                  {book.title.length > 32 ? book.title.slice(0, 29) + '...' : book.title}
                </div>
                <div className={styles.bookAuthor}>{book.author}</div>
                {book.price && <div className={styles.bookPrice}>${book.price}</div>}
              </div>
            </Link>
          ))}
        </div>
        <button className={styles.arrow} onClick={nextSlide}>&gt;</button>
      </div>
    </div>
  );
}

export default BookWheel;
