import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from "./BookDetails.module.css";
import Reviews from "../../components/reviews/Reviews";
import RelatedProducts from "../../components/relatedproducts/RelatedProducts";
import axios from "axios";
import QuantityPicker from "../../components/quantitypicker/QuantityPicker"; 
import { useCart } from '../../components/cartnotification/CartNotification';

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0); 
  const [type, setType] = useState("buy");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: "", comment: "" });
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const { fetchCartCount } = useCart();

  useEffect(() => {
    setLoading(true);


      axios.get('/api/auth/me', { withCredentials: true })
    .then(res => {
      setIsAdmin(res.data.role === 'Admin');
      setUserId(res.data.user_id);
      setRole(res.data.role);
    })
    .catch(() => {
      setIsAdmin(false);
      setRole(null);
      setUserId(null);
    });

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
  if (isAdmin) return alert("Admins are not allowed to add items to the cart.");
  if (!book?.book_id) return alert("Book details not loaded.");
  if (!quantity || Number(quantity) < 1) return alert("Please select quantity.");
  proceedAdd(); // backend will return clear 409 messages if rules are violated
};

function handleReviewSubmit(e) {
  e.preventDefault();
  axios.post(`/api/books/${id}/reviews`, {
    user_id: userId,
    rating: newReview.rating,
    comment: newReview.comment
  }, { withCredentials: true })
    .then(() => {
      setShowReviewForm(false);
      setNewReview({ rating: "", comment: "" });

      // Refresh reviews
      fetch(`http://localhost:8801/api/books/${id}/reviews`)
        .then(res => res.json())
        .then(data => setReviews(data));
    })
    .catch(err => {
      alert("Failed to submit review.");
      console.error(err);
    });
}

// actual add-to-cart POST
function proceedAdd() {
  axios.post(
    "/api/cart/add",
    { book_id: book.book_id, amount: quantity, type },
    { withCredentials: true }
  )
    .then((res) => {
      alert(res.data.message || "Added to cart!");
      fetchCartCount(); 
    })
    .catch((err) => {
      if (err.response && err.response.status === 401) {
        alert("Please log in to add items to your cart.");
      } else if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Failed to add to cart.");
      }
      console.error(err);
    });
}

  if (loading) return <div>Loading...</div>;
  if (!book) return <div>Book not found.</div>;

  return (
    <div className={classes.page}>
      <div className={classes.topSection}>
        <img src={book.img} alt={book.title} className={classes.cover} />
        <div className={classes.info}>
          <div className={classes.title}>{book.title}</div>
          <div className={classes.author}><b>Author:</b> {book.author}</div>
          <div className={classes.detail}><b>Category:</b> {book.category}</div>
          <div className={classes.detail}><b>Genre:</b> {book.genre}</div>
          <div className={classes.desc}>{book.description}</div>
          <div className={classes.detail}><b>In Stock:</b> {book.count}</div>
          <div className={classes.price}>
            <b>Price:</b>{" "}
            {(() => {
              const base = Number(book.discount_percent ? book.final_price : book.price) || 0;
              const shown = type === "rent" ? base / 2 : base;
              return `$${shown.toFixed(2)}`;
            })()}
          </div>

          {book.count > 0 ? (
            <div style={{ margin: "15px 0" }}>
              <QuantityPicker
                maxCount={book.count}
                onChange={(val) => setQuantity(val)}
              />
            </div>
          ) : (
            <div style={{ color: "red", margin: "10px 0" }}>Out of stock</div>
          )}

          <div style={{ margin: "10px 0" }}>
            <label>
              <input
                type="radio"
                value="buy"
                checked={type === "buy"}
                onChange={() => setType("buy")}
                style={{ marginRight: 5 }}
              />
              Buy
            </label>
            <label style={{ marginLeft: 15 }}>
            <input
              type="radio"
              value="rent"
              checked={type === "rent"}
              onChange={() => setType("rent")}
              style={{ marginRight: 5 }}
            />
            Rent
          </label>
          </div>

          <div className={classes.buttonRow}>
            <button
              className={classes.actionButton}
              onClick={handleAddToCart}
              disabled={quantity < 1 || quantity > book.count}
            >
              Add To Cart
            </button>
          </div>
        </div>
      </div>
              {(role === "Staff" || role === "Admin") && (
      <div className={classes.centeredWrapper}>
        <button
          className={classes.editBtn}
          onClick={() => window.location.href = `/edit-book/${book.book_id}`}
        >
          ✏️ Edit Book
        </button>
      </div>
    )}
      <Reviews reviews={reviews} />

          {role === "Regular" && userId && (
      <div className={classes.reviewSection}>
      {!showReviewForm ? (
        <button className={classes.reviewBtn} onClick={() => setShowReviewForm(true)}>
          📝 Add Review
        </button>
      ) : (
        <form onSubmit={handleReviewSubmit} className={classes.reviewForm}>
          <label>
            Rating (1–5):
            <input
              type="number"
              min="1"
              max="5"
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
              required
            />
          </label>
          <label>
            Comment:
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              required
            />
          </label>
          <button type="submit">Submit Review</button>
        </form>
      )}
    </div>
  )}

      <RelatedProducts related={related} />
    </div>
  );
}

export default BookDetails;
