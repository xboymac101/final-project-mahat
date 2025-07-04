import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import styles from './Categories.module.css';
import axios from "axios";

function CategoriesPage() {
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 10;

  const [searchParams] = useSearchParams();
  const discountedOnly = searchParams.get("discounted") === "true";

  useEffect(() => {
    const url = discountedOnly ? "/api/books?discounted=true" : "/api/books";
    axios.get(url)
      .then(res => setBooks(res.data))
      .catch(err => console.error(err));
  }, [discountedOnly]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGenres]);

  const uniqueCategories = ["All", ...Array.from(new Set(books.map(book => book.category)))];
  const uniqueGenres = Array.from(new Set(books.map(book => book.genre)));

  const filteredBooks = books.filter(book => {
    const matchCategory = selectedCategory === "All" || book.category === selectedCategory;
    const matchGenres = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
    return matchCategory && matchGenres;
  });

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const displayedBooks = filteredBooks.slice(
    (currentPage - 1) * booksPerPage,
    currentPage * booksPerPage
  );

  const handleCategory = (cat) => setSelectedCategory(cat);
  const handleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className={styles.categoriesPage}>
      <div className={styles.categoriesWrapper}>
        {discountedOnly && (
          <div className={styles.discountBanner}>
            Showing only discounted books. <Link to="/books">Clear filter</Link>
          </div>
        )}

        <div className={styles.categoriesRow}>
          {uniqueCategories.map(cat => (
            <button
              key={cat}
              className={selectedCategory === cat ? styles.activeCategory : styles.categoryPill}
              onClick={() => handleCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.contentArea}>
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Genres</h3>
            <ul className={styles.genresList}>
              {uniqueGenres.map(genre => (
                <li key={genre}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenre(genre)}
                    />
                    {genre}
                  </label>
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.booksGrid}>
            {displayedBooks.length === 0 && <div>No books found.</div>}
            {displayedBooks.map(book => (
              <Link
                to={`/book/${book.book_id}`}
                key={book.book_id}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className={styles.bookCard}>
                  <img src={book.img} alt={book.title} className={styles.bookImg} />
                  <div className={styles.bookTitle}>{book.title}</div>
                  <div className={styles.bookAuthor}>{book.author}</div>
                  <div className={styles.bookPrice}>
                    {book.discount_percent ? (
                      <>
                        <span className={styles.originalPrice}>${book.price}</span>
                        <span className={styles.discountedPrice}>${book.final_price}</span>
                      </>
                    ) : (
                      `$${book.price}`
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? styles.activePage : styles.pageBtn}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {">"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;
