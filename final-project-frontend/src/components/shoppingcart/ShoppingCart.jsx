import { useEffect, useState } from "react";
import axios from "axios";

export default function ShoppingCart({ user_id }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    axios.get(`/api/cart/${user_id}`)
      .then(res => setCart(res.data))
      .catch(err => console.error(err));
  }, [user_id]);

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
