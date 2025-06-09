import { useEffect, useState } from "react";
import axios from "axios";

export default function ShoppingCart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios
      .get("/api/cart", { withCredentials: true }) // <--- Only this!
      .then((res) => setCart(res.data))
      .catch((err) => {
        console.error(err);
        // Optional: handle unauthorized (not logged in)
        if (err.response && err.response.status === 401) {
          alert("Please log in to view your cart.");
        }
      });
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.amount, 0);

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cart.length === 0 && <p>Cart is empty.</p>}
      <ul>
        {cart.map((item) => (
          <li key={item.id}>
            <img src={item.image} alt={item.title} width={50} />
            {item.title} - ${item.price} x {item.amount}
          </li>
        ))}
      </ul>
      <h3>Total: ${total.toFixed(2)}</h3>
    </div>
  );
}
