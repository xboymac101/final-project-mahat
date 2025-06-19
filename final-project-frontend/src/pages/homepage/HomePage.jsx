import React, { useState, useEffect } from 'react';
import BookWheel from '../../components/bookwheel/BookWheel';
import styles from './HomePage.module.css';

function BooksHome() {
  const [books, setBooks] = useState([]);
  const [randomFact, setRandomFact] = useState('');
  const [mustReads, setMustReads] = useState([]);
  const [randomFact1, setRandomFact1] = useState('');
  const [randomFact2, setRandomFact2] = useState('');

 useEffect(() => {
  fetch("http://localhost:8801/api/books")
    .then(res => res.json())
    .then(data => {
      setBooks(data);
      setMustReads(shuffle(data).slice(0, 10));
    });

  
  fetch("http://localhost:8801/api/facts/random")
    .then(res => res.json())
    .then(data => setRandomFact1(data.fact))
    .catch(() => setRandomFact1("Books can take you anywhere – even when you're staying in place."));

  
  fetch("http://localhost:8801/api/facts/random")
    .then(res => res.json())
    .then(data => setRandomFact2(data.fact))
    .catch(() => setRandomFact2("There’s always something new to learn from a great book."));
}, []);

  const shuffle = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const discountedBooks = books.filter(book => book.discount_percent);

  return (
    <div className={styles.booksHome}>
      <div className={styles.banner}>
        <h1>📘 Welcome to BookHaven</h1>
        <p>Explore our top picks, discounted gems, and must-reads!</p>
      </div>

      {/* Top Books */}
      <BookWheel books={books.slice(0, 10)} title="📚 Bestsellers" seeAllLink="/books" />

      {/* Random Fact */}
      <div className={styles.randomFact}>
        <h3>📚 Did You Know?</h3>
        <p>{randomFact1}</p>
      </div>

      {/* Discounted Books */}
      <BookWheel
        books={discountedBooks.slice(0, 12)}
        title="🔥 Discounted Books"
        seeAllLink="/books?discounted=true"
      />

        {/* Random Fact */}
      <div className={styles.randomFact}>
        <h3>📚 Did You Know?</h3>
        <p>{randomFact2}</p>
      </div>

      {/* Must Read Books */}
      <BookWheel
        books={mustReads}
        title="📖 Must Reads"
        seeAllLink="/books"
      />
    </div>
  );
}

export default BooksHome;
