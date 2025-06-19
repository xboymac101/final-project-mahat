import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './BookWheel.module.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function BookWheel({ books = [], title = "Books", seeAllLink = "/books" }) {
  const [start, setStart] = useState(0);
  const visibleCount = 6;

  if (!books || books.length === 0) return null;

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
        <h2 className={styles.title}>{title}</h2>
        <Link to={seeAllLink} className={styles.seeAll}>See All</Link>
      </div>

      <div className={styles.carousel}>
        <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prevSlide}>
          <FaChevronLeft />
        </button>

        <div className={styles.booksRow}>
          {visibleBooks.map(book => (
            <Link
              to={`/book/${book.book_id}`}
              key={book.book_id}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className={styles.bookCard}>
                <img src={book.img} alt={book.title} className={styles.bookImg} />
                <div className={styles.bookName}>
                  {book.title.length > 32 ? book.title.slice(0, 29) + '...' : book.title}
                </div>
                <div className={styles.bookAuthor}>{book.author}</div>
                <div className={styles.bookPrice}>
                  {book.discount_percent ? (
                    <>
                      <span className={styles.originalPrice}>${book.price}</span>
                      <span className={styles.discountedPrice}>${book.final_price}</span>
                    </>
                  ) : (
                    `$${Number(book.final_price).toFixed(2)}`
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={nextSlide}>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default BookWheel;
