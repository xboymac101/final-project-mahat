import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Discounts.module.css';

export default function Discounts() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState('book');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    axios.get('/api/books').then(res => setBooks(res.data)).catch(console.error);
    axios.get('/api/categories').then(res => setCategories(res.data)).catch(console.error);
    fetchDiscounts();
  }, []);

  function fetchDiscounts() {
    axios.get('/api/admin/discounts', { withCredentials: true })
      .then(res => setDiscounts(res.data))
      .catch(console.error);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      discount_percent: Number(discount),
    };

    if (type === 'book') {
      payload.book_id = selectedBook;
    } else if (type === 'category') {
      payload.category = selectedCategory;
    }

    if (!payload.book_id && !payload.category) {
      alert("Please select a book or category.");
      return;
    }

    axios.post('/api/admin/discounts', payload, { withCredentials: true })
      .then(() => {
        setSuccessMsg("Discount applied successfully.");
        setDiscount('');
        setSelectedBook('');
        setSelectedCategory('');
        fetchDiscounts();
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to apply discount.");
      });
  }

  function handleRemove(type, value) {
    axios.post('/api/admin/discounts/remove', { type, target: value }, { withCredentials: true })
      .then(() => {
        fetchDiscounts();
      })
      .catch(() => alert("Failed to remove discount."));
  }

  return (
    <div className={styles.discountPage}>
      <h2>💰 Manage Discounts</h2>

      <form onSubmit={handleSubmit} className={styles.discountForm}>
        <div className={styles.selector}>
          <label>
            <input
              type="radio"
              value="book"
              checked={type === 'book'}
              onChange={() => setType('book')}
            />
            Per Book
          </label>
          <label>
            <input
              type="radio"
              value="category"
              checked={type === 'category'}
              onChange={() => setType('category')}
            />
            Per Category
          </label>
        </div>

        {type === 'book' ? (
          <select
            value={selectedBook}
            onChange={e => setSelectedBook(e.target.value)}
            required
            className={styles.dropdown}
          >
            <option value="">Select Book</option>
            {books.map(b => (
              <option key={b.book_id} value={b.book_id}>{b.title}</option>
            ))}
          </select>
        ) : (
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            required
            className={styles.dropdown}
          >
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <input
          type="number"
          placeholder="Discount %"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          min="1"
          max="99"
          className={styles.inputField}
          required
        />

        <button type="submit" className={styles.submitBtn}>Apply Discount</button>
        {successMsg && <p className={styles.success}>{successMsg}</p>}
      </form>

      <div className={styles.discountList}>
        <h3>📝 Active Discounts</h3>
        <ul>
          {discounts.map(d => (
            <li key={d.discount_id} className={styles.discountItem}>
              {d.book_id ? (
                <span>📘 <strong>{d.title}</strong> — {d.discount_percent}%</span>
              ) : (
                <span>📂 <strong>{d.category}</strong> — {d.discount_percent}%</span>
              )}
              <button
                className={styles.removeBtn}
                onClick={() =>
                  handleRemove(d.book_id ? 'book' : 'category', d.book_id || d.category)
                }
              >
                ❌ Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
