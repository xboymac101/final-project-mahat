import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './SearchPage.module.css';

const BOOKS_PER_PAGE = 12;

export default function SearchPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const search = queryParams.get('search') || '';
  const discountedOnly = queryParams.get('discounted') === 'true';
  const mustOnly = queryParams.get('must') === 'true';

  useEffect(() => {
    setLoading(true);
    axios.get('/api/books', {
      params: {
        search,
        discounted: discountedOnly ? 'true' : undefined
      }
    })
      .then(res => {
        let fetchedBooks = res.data;

        // Filter random books if mustOnly is active
        if (mustOnly) {
          const shuffled = [...fetchedBooks].sort(() => Math.random() - 0.5);
          fetchedBooks = shuffled.slice(0, 10);
        }

        setBooks(fetchedBooks);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching books:', err);
        setLoading(false);
      });
  }, [search, discountedOnly, mustOnly]);

  const handleBookClick = (id) => navigate(`/book/${id}`);

  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const endIndex = startIndex + BOOKS_PER_PAGE;
  const currentBooks = books.slice(startIndex, endIndex);
  const totalPages = Math.ceil(books.length / BOOKS_PER_PAGE);

  return (
    <div className={styles.searchPage}>
      <div className={styles.searchWrapper}>
        <h2 className={styles.title}>
          {search
            ? `🔍 Results for "${search}"`
            : discountedOnly
            ? '🔥 Discounted Books'
            : mustOnly
            ? '📖 Must Read Books'
            : '📚 Best Sellers'}
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : books.length === 0 ? (
          <p>No books found.</p>
        ) : (
          <>
            <div className={styles.grid}>
              {currentBooks.map(book => (
                <div
                  key={book.book_id}
                  className={styles.card}
                  onClick={() => handleBookClick(book.book_id)}
                >
                  <img src={book.img} alt={book.title} />
                  <h3>{book.title}</h3>
                  <p>{book.author}</p>
                  <p className={styles.price}>${Number(book.final_price).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
