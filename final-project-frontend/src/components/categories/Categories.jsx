import React, { useState, useEffect } from 'react';
import styles from './Categories.module.css';
import axios from "axios";
// Dummy data: Replace with real data from your DB/API
const CATEGORIES = [
  "All", "Fiction", "Non-Fiction", "Biography", "Cookbooks", "Comics", "Children's Books", "Art & Craft"
];

const GENRES = [
  "Fantasy", "Classic", "Science Fiction", "Romance", "Mystery", "Adventure", "Satire", "Epic", "Children's", "Historical", "Horror", "Absurdist", "Modernist", "Philosophical", "Crime"
];



function CategoriesPage() {
  // Normally fetch these from backend/database:
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGenres, setSelectedGenres] = useState([]);
  useEffect(() => {
    axios.get('/api/books')
      .then(res => setBooks(res.data))
      .catch(err => console.error(err));
  }, []);

  // Filtering logic
  const filteredBooks = books.filter(book => {
    // Filter by category
    const matchCategory = selectedCategory === "All" || book.category === selectedCategory;
    // Filter by genres
    const matchGenres = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
    return matchCategory && matchGenres;
  });

  // Handlers
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
      {/* Top: Category pills */}
      <div className={styles.categoriesRow}>
        {CATEGORIES.map(cat => (
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
        {/* Left: Genre checkboxes */}
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Genres</h3>
          <ul className={styles.genresList}>
            {GENRES.map(genre => (
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

        {/* Right: Book grid */}
        <section className={styles.booksGrid}>
          {filteredBooks.length === 0 && <div>No books found.</div>}
          {filteredBooks.map(book => (
            <div key={book.title} className={styles.bookCard}>
              <img src={book.img} alt={book.title} className={styles.bookImg} />
              <div className={styles.bookTitle}>{book.title}</div>
              <div className={styles.bookAuthor}>{book.author}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default CategoriesPage;
