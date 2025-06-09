import { useEffect, useState } from "react";
import axios from "axios";
import classes from './ShoppingCart.module.css';

export default function ShoppingCart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios
      .get("/api/cart", { withCredentials: true })
      .then((res) => setCart(res.data))
      .catch((err) => {
        console.error(err);
        if (err.response && err.response.status === 401) {
          alert("Please log in to view your cart.");
        }
      });
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.amount, 0);

  return (
    <div className={classes["cart-container"]}>
      <h2>Your Cart</h2>
      {cart.length === 0 && <p>Cart is empty.</p>}
      <ul className={classes["cart-list"]}>
        {cart.map((item) => (
          <li key={item.id} className={classes["cart-item"]}>
            <img
              src={item.image || "https://via.placeholder.com/60x85?text=No+Image"}
              alt={item.title}
              className={classes["cart-item-img"]}
              onError={e => e.target.src = "https://via.placeholder.com/60x85?text=No+Image"}
            />
            <div className={classes["cart-item-details"]}>
              <div className={classes["cart-item-title"]}>{item.title}</div>
              <div className={classes["cart-item-meta"]}>
                ${item.price} × <span className={classes["cart-item-amount"]}>{item.amount}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <h3 className={classes["cart-total"]}>Total: ${total.toFixed(2)}</h3>
    </div>
  );
}
