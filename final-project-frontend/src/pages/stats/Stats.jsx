import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Stats.module.css";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("/api/admin/stats", { withCredentials: true })
      .then(res => setStats(res.data))
      .catch(err => {
        console.error(err);
        setError("Failed to load statistics.");
      });
  }, []);

  if (error) return <div className={styles.container}><p className={styles.error}>{error}</p></div>;
  if (!stats) return <div className={styles.container}><p>Loading...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📊 Site Statistics</h1>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p>{stats.totalOrders}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <p>${stats.totalRevenue}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Books in Stock</h3>
          <p>{stats.totalBooks}</p>
        </div>
      </div>

      <h2 className={styles.subTitle}>🔥 Top 5 Books</h2>
      <ul className={styles.bookList}>
        {stats.topBooks.map((book, index) => (
          <li key={index}>{index + 1}. {book.title} — {book.sales} sales</li>
        ))}
      </ul>
    </div>
  );
}
