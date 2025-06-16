import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./OrderHistory.module.css";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get("/api/order/history", { withCredentials: true })
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={styles.ordersContainer}>
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
    orders.map((order, index) => (
        <div key={order.order_id} className={styles.orderCard}>
            <p className={styles.orderTitle}>
            Order #{order.order_id} (Your {index + 1}{['st','nd','rd'][index] || 'th'} order) – {order.status}
            </p>
            <ul>
              {order.items.map(item => (
                <li key={item.item_id} className={styles.orderItem}>
                  {item.title} - {item.type} × {item.quantity} (${item.price})
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
