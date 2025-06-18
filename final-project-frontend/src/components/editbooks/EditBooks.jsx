import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './EditBooks.module.css';

function EditBooks() {
  const { id } = useParams(); // book_id from URL
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
  });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/books/${id}`)
      .then(res => {
        setBook(res.data);
        setFormData(res.data);
      })
      .catch(err => {
        console.error(err);
        alert('Failed to load book data');
      });
  }, [id]);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    axios.put(`/api/books/${id}`, formData)
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
        {Object.entries(formData).map(([key, value]) => (
          <label key={key}>
            {key[0].toUpperCase() + key.slice(1)}:
            <input
              type={key === 'price' || key === 'count' ? 'number' : 'text'}
              name={key}
              value={value}
              onChange={handleChange}
              required
            />
          </label>
        ))}
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}

export default EditBooks;
