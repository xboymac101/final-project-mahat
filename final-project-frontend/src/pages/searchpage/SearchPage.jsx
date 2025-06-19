import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './SearchPage.module.css'; // optional CSS module

const BOOKS_PER_PAGE = 12;

export default function SearchPage() {
    const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    setLoading(true);
    axios.get('/api/books', {
      params: { search }
    })
      .then(res => {
        setBooks(res.data);
        setLoading(false);
        setCurrentPage(1); // reset to page 1 on new search
      })
      .catch(err => {
        console.error('Error fetching books:', err);
        setLoading(false);
      });
  }, [search]);

  const handleBookClick = (id) => {
    navigate(`/book/${id}`);
  };

  // Pagination logic
  const startIndex = (currentPage - 1) * BOOKS_PER_PAGE;
  const endIndex = startIndex + BOOKS_PER_PAGE;
  const currentBooks = books.slice(startIndex, endIndex);
  const totalPages = Math.ceil(books.length / BOOKS_PER_PAGE);

  return (
    <div className={styles.booksPage}>
      <h2>{search ? `Results for "${search}"` : 'All Books'}</h2>

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
                <p>{book.final_price} ₪</p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}