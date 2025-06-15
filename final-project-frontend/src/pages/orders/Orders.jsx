import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Orders.module.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

useEffect(() => {
  axios.get("/api/admin/orders", { withCredentials: true })
    .then(res => {
      console.log("Orders response:", res.data); // ✅ debug
      const safeOrders = res.data?.orders || [];
      setOrders(safeOrders);
    })
    .catch(err => {
      console.error("Orders fetch error:", err);
      setOrders([]); // fallback to prevent crash
      setError("Failed to load orders.");
    });
}, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📦 Orders</h1>

      {error && <p className={styles.error}>{error}</p>}

      {orders.length === 0 ? (
        <p className={styles.empty}>No orders found.</p>
      ) : (
        <ul className={styles.list}>
          {orders.map(order => (
            <li key={order.id} className={styles.orderItem}>
              <div><strong>Order ID:</strong> {order.id}</div>
              <div><strong>Customer:</strong> {order.customer_name}</div>
              <div><strong>Status:</strong> {order.status}</div>
              <div><strong>Items:</strong> {order.items.join(", ")}</div>
              <div><strong>Total:</strong> ${order.total}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
