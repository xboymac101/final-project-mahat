import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookWheel from '../bookwheel/BookWheel';
import styles from './HomePage.module.css';

function BooksHome() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8801/api/books")
      .then(res => res.json())
      .then(data => setBooks(data));
  }, []);

  return (
    <div className={styles.booksHome}>
      <h1 className={styles.booksHomeTitle}>Books</h1>
      <BookWheel books={books} /> 
      <div className={styles.booksGrid}>
        {books.map(book => (
          <Link to={`/book/${book.book_id}`} key={book.book_id} style={{ textDecoration: "none", color: "inherit" }}>
            <div className={styles.bookCard}>
              <img src={book.img} alt={book.title} className={styles.bookImage} />
              <div className={styles.bookInfo}>
                <div className={styles.bookPrice}>
                  {book.price ? `$${book.price}` : ""}
                </div>
                <div className={styles.bookName}>{book.title}</div>
                <div className={styles.bookAuthor}>{book.author}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}


export default BooksHome;
