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
    <div className={styles.container}>
      <h2>My Orders</h2>
      <div className={styles.scrollArea}>
        {orders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          orders.map((order, index) => (
            <div key={order.order_id} className={styles.orderCard}>
              <p className={styles.orderTitle}>
                Order #{order.order_id} (Your {index + 1}{['st','nd','rd'][index] || 'th'} order) – {order.status}
              </p>
              <ul className={styles.orderItems}>
                {order.items.map(item => (
                  <li key={item.item_id} className={styles.orderItem}>
                    <span className={styles.bookTitle}>{item.title}</span>
                    <span className={styles.itemType}>{item.type === 'rent' ? 'Rent' : 'Buy'}</span>
                    × <span className={styles.itemQty}>{item.quantity}</span>
                    <span className={styles.itemPrice}>${item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
