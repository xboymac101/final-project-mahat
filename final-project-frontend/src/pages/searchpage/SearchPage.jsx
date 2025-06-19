import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './SearchPage.module.css'; // optional CSS module

export default function SearchPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const search = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    setLoading(true);
    axios.get('/api/books', {
      params: { search }
    })
    .then(res => {
      setBooks(res.data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [search]);

  return (
    <div className={styles.booksPage}>
      <h2>{search ? `Results for "${search}"` : 'All Books'}</h2>

      {loading ? (
        <p>Loading...</p>
      ) : books.length === 0 ? (
        <p>No books found.</p>
      ) : (
        <div className={styles.grid}>
          {books.map(book => (
            <div key={book.book_id} className={styles.card}>
              <img src={book.img} alt={book.title} />
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>{book.final_price}₪</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
