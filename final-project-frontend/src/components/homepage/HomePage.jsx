import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookWheel from '../bookwheel/BookWheel';
import styles from './HomePage.module.css';
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
function BooksHome() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    setBooks([
      { id: 1, img: 'https://covers.openlibrary.org/b/id/8231856-L.jpg', name: 'The Hobbit', price: '$14.99' },
      { id: 2, img: 'https://covers.openlibrary.org/b/id/9251996-L.jpg', name: 'To Kill a Mockingbird', price: '$12.49' },
      { id: 3, img: 'https://covers.openlibrary.org/b/id/10523382-L.jpg', name: '1984', price: '$11.99' },
      { id: 4, img: 'https://covers.openlibrary.org/b/id/8101341-L.jpg', name: 'Pride and Prejudice', price: '$10.75' },
      { id: 5, img: 'https://covers.openlibrary.org/b/id/10958341-L.jpg', name: 'The Great Gatsby', price: '$13.30' },
      { id: 6, img: 'https://covers.openlibrary.org/b/id/10210908-L.jpg', name: 'Harry Potter 1', price: '$15.99' },
      { id: 7, img: 'https://covers.openlibrary.org/b/id/8228691-L.jpg', name: 'Brave New World', price: '$12.20' },
      { id: 8, img: 'https://covers.openlibrary.org/b/id/8369255-L.jpg', name: 'The Catcher in the Rye', price: '$9.99' },
      { id: 9, img: 'https://covers.openlibrary.org/b/id/10229951-L.jpg', name: 'The Little Prince', price: '$8.80' },
      { id: 10, img: 'https://covers.openlibrary.org/b/id/8905431-L.jpg', name: 'Animal Farm', price: '$10.40' },
      { id: 11, img: 'https://covers.openlibrary.org/b/id/9872172-L.jpg', name: 'Moby Dick', price: '$13.60' },
      { id: 12, img: 'https://covers.openlibrary.org/b/id/10545556-L.jpg', name: 'Frankenstein', price: '$9.20' },
      { id: 13, img: 'https://covers.openlibrary.org/b/id/11032789-L.jpg', name: 'Crime and Punishment', price: '$14.25' },
      { id: 14, img: 'https://covers.openlibrary.org/b/id/10936532-L.jpg', name: 'Jane Eyre', price: '$11.50' },
      { id: 15, img: 'https://covers.openlibrary.org/b/id/10909258-L.jpg', name: 'The Odyssey', price: '$13.99' },
    ]);
  }, []);
  return (
    <div className={styles.booksHome}>
      <h1 className={styles.booksHomeTitle}>Books</h1>
      <BookWheel />
      <div className={styles.booksGrid}>
        {books.map(book => (
          <div key={book.id} className={styles.bookCard}>
            <Link to={`/book/${book.id}`}>
              <img src={book.img} alt={book.name} className={styles.bookImage} />
            </Link>
            <div className={styles.bookInfo}>
              <div className={styles.bookName}>{book.name}</div>
              <div className={styles.bookPrice}>{book.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BooksHome;
