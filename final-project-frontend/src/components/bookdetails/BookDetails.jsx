import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from "./BookDetails.module.css";
import Reviews from "../reviews/Reviews";
import RelatedProducts from "../relatedproducts/RelatedProducts";
import QuantityPicker from "./QuantityPicker"; 

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0); 

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

          {/* ✅ Quantity Picker */}
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

          <div className={classes.buttonRow}>
            <button
              className={classes.actionButton}
              disabled={quantity === 0}
              onClick={() => alert(`Added ${quantity} to cart!`)}
            >
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
