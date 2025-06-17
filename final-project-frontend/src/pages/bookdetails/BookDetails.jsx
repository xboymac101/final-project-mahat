import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import classes from "./BookDetails.module.css";
import Reviews from "../../components/reviews/Reviews";
import RelatedProducts from "../../components/relatedproducts/RelatedProducts";
import axios from "axios";
import QuantityPicker from "../../components/quantitypicker/QuantityPicker"; 

function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(0); 
  const [type, setType] = useState("buy");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);

    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => setIsAdmin(res.data.role === 'Admin'))
      .catch(() => setIsAdmin(false));

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
  if (isAdmin) {
    alert("Admins are not allowed to add items to the cart.");
    return;
  }

  if (!book || !book.book_id) {
    alert("Book details not loaded.");
    return;
  }

  if (!quantity || quantity < 1) {
    alert("Please select quantity.");
    return;
  }

  if (type === "rent") {
    axios.get("/api/cart", { withCredentials: true })
      .then(res => {
        const rentalTotal = res.data
          .filter(item => item.type === "rent")
          .reduce((sum, item) => sum + item.amount, 0);

        const MAX_RENTALS = 5;
        const totalAfterAdd = rentalTotal + quantity;

        if (totalAfterAdd > MAX_RENTALS) {
          alert(`You can only rent up to ${MAX_RENTALS} books. You currently have ${rentalTotal} in your cart.`);
          return;
        }

        proceedAdd(); // proceed with actual add
      })
      .catch(() => {
        alert("Failed to check your cart. Please try again.");
      });
  } else {
    proceedAdd(); // for buy type
  }
};

// actual add-to-cart POST logic
function proceedAdd() {
  axios.post(
    "/api/cart/add",
    { book_id: book.book_id, amount: quantity, type },
    { withCredentials: true }
  )
    .then((res) => {
      alert(res.data.message || "Added to cart!");
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
          <div className={classes.price}><b>Price:</b> ${book.price}</div>

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

      <Reviews reviews={reviews} />
      <RelatedProducts related={related} />
    </div>
  );
}

export default BookDetails;
