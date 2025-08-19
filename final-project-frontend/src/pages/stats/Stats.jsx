import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./stats.module.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState(30);

  useEffect(() => {
    axios.get(`/api/admin/stats?range=${range}`)
      .then((res) => setStats(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to load statistics.");
      });
  }, [range]);

  if (error) return <p>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const chartData = [
    { name: "Total Orders", value: stats.totalOrders },
    { name: "Completed", value: stats.completedOrders },
    { name: "Canceled", value: stats.canceledOrders },
  ];

  return (
  <div className={styles.statsPage}>
    {error ? (
      <p>{error}</p>
    ) : !stats ? (
      <p>Loading...</p>
    ) : (
      <div className={styles.statsWrapper}>
        <h1>📊 Admin Statistics</h1>

        <div className={styles.rangeSelector}>
          <label>Select Range:</label>
          <select value={range} onChange={(e) => setRange(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.card}><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
          <div className={styles.card}><h3>Completed Orders</h3><p>{stats.completedOrders}</p></div>
          <div className={styles.card}><h3>Canceled Orders</h3><p>{stats.canceledOrders}</p></div>
          <div className={styles.card}><h3>Total Revenue</h3><p>${Number(stats.revenue || 0).toFixed(2)}</p></div>
          <div className={styles.card}><h3>Top Book</h3><p>{stats.topBook?.title || 'N/A'}</p></div>
          <div className={styles.card}><h3>Top Customer</h3><p>{stats.topCustomer?.name || 'N/A'}</p></div>
        </div>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )}
  </div>
);

}
