import { useEffect, useState } from "react";
import axios from "axios";
import classes from './ShoppingCart.module.css';
import UserDetailsPopup from "../../components/userdetailspopup/UserDetailsPopup"
import PayPalButton from "../../components/paypal/PayPalButton"

export default function ShoppingCart() {
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => {
        if (res.data.role === "Admin") setIsAdmin(true);
      })
      .catch(() => setIsAdmin(false));

    fetchCart(); 
  }, []);

  function fetchCart() {
    axios
      .get("/api/cart", { withCredentials: true })
      .then((res) => setCart(res.data))
      .catch((err) => {
        console.error(err);
        if (err.response && err.response.status === 401) {
          alert("Please log in to view your cart.");
        }
      });
  }

  function checkUserDetails() {
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then((res) => {
        const { phone_number, address } = res.data;
        if (!phone_number || !address) {
          setShowPopup(true);
        }
      })
      .catch((err) => {
        console.error("Failed to check user info:", err);
      });
  }

  function handleRemove(book_id, type) {
    axios
      .post("/api/cart/remove", { book_id, type }, { withCredentials: true })
      .then(() => fetchCart())
      .catch(() => alert("Error removing item"));
  }

  function handleDecrease(book_id, type) {
    setProcessing(true);
    axios
      .post("/api/cart/decrease", { book_id, type }, { withCredentials: true })
      .then(() => {
        fetchCart();
        setProcessing(false);
      })
      .catch((err) => {
        alert("Failed to update. " + (err.response?.data?.message || ""));
        setProcessing(false);
      });
  }

 function handleIncrease(book_id, currentAmount, maxCount, type) {
  if (processing) return;

  setProcessing(true);

  axios.get("/api/cart", { withCredentials: true })
    .then(res => {
      const cart = res.data;

      const rentalTotal = cart
        .filter(item => item.type === "rent")
        .reduce((sum, item) => sum + item.amount, 0);

      const MAX_RENTALS = 5;
      if (type === "rent" && rentalTotal >= MAX_RENTALS) {
        alert(`You can only rent up to ${MAX_RENTALS} books.`);
        setProcessing(false);
        return;
      }
console.log("Trying to add:", {
  book_id,
  amount: 1,
  type
});
      axios.post("/api/cart/add", { book_id, amount: 1, type }, { withCredentials: true })
        .then(() => {
          fetchCart();
          setProcessing(false);
        })
        .catch((err) => {
          alert("Error updating item: " + (err.response?.data?.message || ""));
          setProcessing(false);
        });
    })
    .catch((err) => {
      alert("Failed to check cart.");
      setProcessing(false);
    });
}


  const total = cart.reduce((sum, item) => sum + item.price * item.amount, 0);

  return (
    <div className={classes["cart-container"]}>
      <h2>Your Cart</h2>

      {showPopup && (
        <UserDetailsPopup onComplete={() => setShowPopup(false)} />
      )}

      {isAdmin ? (
        <p>Admins are not allowed to make purchases.</p>
      ) : (
        <>
          {cart.length === 0 && <p>Cart is empty.</p>}

          <ul className={classes["cart-list"]}>
            {cart.map((item) => (
              <li key={`${item.book_id}-${item.type}`} className={classes["cart-item"]}>
                <img
                  src={item.image || "https://via.placeholder.com/60x85?text=No+Image"}
                  alt={item.title}
                  className={classes["cart-item-img"]}
                  onError={(e) => (e.target.src = "https://via.placeholder.com/60x85?text=No+Image")}
                />
                <div className={classes["cart-item-details"]}>
                  <div className={classes["cart-item-title"]}>
                    {item.title}
                    <span className={classes["cart-item-type"]}>
                      ({item.type === "rent" ? "Rent" : "Buy"})
                    </span>
                  </div>
                  <div className={classes["cart-item-meta"]}>
                    <button
                      className={classes["dec-btn"]}
                      disabled={item.amount <= 1 || processing}
                      onClick={() => handleDecrease(item.book_id, item.type)}
                    >
                      -
                    </button>
                    <span className={classes["cart-item-amount"]}>{item.amount}</span>
                    <button
                      className={classes["inc-btn"]}
                      onClick={() =>
                        handleIncrease(item.book_id, item.amount, item.count, item.type)
                      }
                      disabled={item.amount >= item.count || processing}
                    >
                      +
                    </button>
                    × ${item.price}
                  </div>
                  <button
                    onClick={() => handleRemove(item.book_id, item.type)}
                    className={classes["remove-btn"]}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <h3 className={classes["cart-total"]}>Total: ${total.toFixed(2)}</h3>
          {total > 0 && (
            <div className={classes["paypal-wrapper"]}>
              <PayPalButton amount={total} cart={cart} setCart={setCart} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
