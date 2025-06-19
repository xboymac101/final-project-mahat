import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './EditBooks.module.css';

function EditBooks() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    price: '',
    count: '',
    img: '',
    category: '',
    genre: '',
    discount_percent: '',
    availability: 'Available',
  });
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/books/${id}`)
      .then(res => {
        const { final_price, ...rest } = res.data;
        rest.availability = rest.Availability === 'Checked Out' ? 'Out of Stock' : rest.Availability || 'Available';
        setBook(res.data);
        setFormData(rest);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to load book data');
      });

    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => setRole(res.data.role))
      .catch(() => setRole(null));
  }, [id]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const dataToSend = { ...formData };

    // Adjust availability values before saving
    if (dataToSend.availability === 'Out of Stock') {
      dataToSend.count = 0;
    }

    // Only admins can modify discounts
    if (role !== 'Admin') delete dataToSend.discount_percent;

    axios.put(`/api/books/${id}`, dataToSend)
      .then(() => {
        alert('Book updated!');
        navigate(`/book/${id}`);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to update book');
      });
  }

  if (!book) return <div>Loading...</div>;

  return (
    <div className={styles.editBookContainer}>
      <h2>Edit Book: {book.title}</h2>
      <form onSubmit={handleSubmit} className={styles.editBookForm}>
        {Object.entries(formData).map(([key, value]) => {
          if (key === 'discount_percent' && role !== 'Admin') return null;
          if (key === 'final_price') return null;

          if (key === 'availability') {
            return (
              <label key={key}>
                Availability:
                <select name="availability" value={value} onChange={handleChange}>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </label>
            );
          }

          if (key === 'count') {
            if (formData.availability !== 'Available') return null;
            return (
              <label key={key}>
                Count:
                <select name="count" value={value} onChange={handleChange}>
                  {[...Array(100)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={key}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
              <input
                type={['price', 'discount_percent'].includes(key) ? 'number' : 'text'}
                name={key}
                value={value}
                onChange={handleChange}
                required
              />
            </label>
          );
        })}
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default EditBooks;
