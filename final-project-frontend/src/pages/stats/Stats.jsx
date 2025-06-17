import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./stats.module.css";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/admin/stats")
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load statistics.");
      });
  }, []);

  if (error) return <p>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  return (
    <div className={styles.statsPage}>
      <h1>📊 Admin Statistics</h1>
      <div className={styles.statsGrid}>
        <div className={styles.card}><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
        <div className={styles.card}><h3>Completed Orders</h3><p>{stats.completedOrders}</p></div>
        <div className={styles.card}><h3>Canceled Orders</h3><p>{stats.canceledOrders}</p></div>
        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p>${Number(stats.revenue || 0).toFixed(2)}</p>
        </div>
        <div className={styles.card}><h3>Top Book</h3><p>{stats.topBook?.title || 'N/A'}</p></div>
        <div className={styles.card}><h3>Top Customer</h3><p>{stats.topCustomer?.name || 'N/A'}</p></div>
      </div>
    </div>
  );
}
