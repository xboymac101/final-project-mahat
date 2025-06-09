import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from "./BookDetails.module.css";
import Reviews from "../reviews/Reviews"
import RelatedProducts from "../relatedproducts/RelatedProducts";
import axios from "axios";
function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost:8801/api/books/${id}`)
      .then((res) => res.json())
      .then((data) => setBook(data));

    fetch(`http://localhost:8801/api/books/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(data));

    fetch(`http://localhost:8801/api/books/${id}/related`)
      .then((res) => res.json())
      .then((data) => {
        setRelated(data);
        setLoading(false);
      });
  }, [id]);
  const handleAddToCart = () => {
    // Check if book and book.book_id exist (adjust to your field name)
    if (!book || !book.book_id) {
      alert("Book details not loaded.");
      return;
    }
    axios.post(
      "/api/cart/add",
      { book_id: book.book_id, amount: 1 }, // Or book.id if your PK is 'id'
      { withCredentials: true }
    )
      .then((res) => {
        alert(res.data.message || "Added to cart!");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          alert("Please log in to add items to your cart.");
        } else {
          alert("Failed to add to cart.");
          console.error(err);
        }
      });
  };

  if (loading) return <div>Loading...</div>;
  if (!book) return <div>Book not found.</div>;

  return (
    <div className={classes.page}>
      {/* Top Section */}
      <div className={classes.topSection}>
        <img src={book.img} alt={book.title} className={classes.cover} />
        <div className={classes.info}>
          <div className={classes.title}>{book.title}</div>
          <div className={classes.author}><b>Author:</b> {book.author}</div>
          <div className={classes.detail}><b>Category:</b> {book.category}</div>
          <div className={classes.detail}><b>Genre:</b> {book.genre}</div>
          <div className={classes.desc}>{book.description}</div>
          <div className={classes.price}><b>Price:</b> ${book.price}</div>
          <div className={classes.buttonRow}>
          <button className={classes.actionButton} onClick={handleAddToCart}>
            Add To Cart
          </button>
            <button className={classes.actionButton}>Rent</button>
          </div>
        </div>
      </div>

      <Reviews reviews={reviews} />
      <RelatedProducts related={related} />
    </div>
  );
}

export default BookDetails;
