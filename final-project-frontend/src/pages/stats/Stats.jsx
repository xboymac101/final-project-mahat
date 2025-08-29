import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./stats.module.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  // Quick range state
  const [range, setRange] = useState(30);

  // Live inputs (not applied yet)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // The dates that were actually applied (control fetching)
  const [appliedDates, setAppliedDates] = useState(null); // { from: "YYYY-MM-DD", to: "YYYY-MM-DD" } | null

  // Build the URL only from applied state (or range)
  const buildUrl = () => {
    if (appliedDates?.from && appliedDates?.to) {
      return `/api/admin/stats?fromDate=${appliedDates.from}&toDate=${appliedDates.to}`;
    }
    return `/api/admin/stats?range=${range}`;
    // Note: fromDate/toDate are NOT used here, only appliedDates
  };

  // Fetch whenever quick range changes OR applied dates change
 useEffect(() => {
  const url = appliedDates?.from && appliedDates?.to
    ? `/api/admin/stats?fromDate=${appliedDates.from}&toDate=${appliedDates.to}`
    : `/api/admin/stats?range=${range}`;
  
  setError("");
  setStats(null);

  axios.get(url)
    .then((res) => setStats(res.data))
    .catch((err) => {
      console.error(err);
      setError("Failed to load statistics.");
    });
}, [range, appliedDates]);

  const onApply = () => {
    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      return;
    }
    if (new Date(fromDate) > new Date(toDate)) {
      setError("From date cannot be after To date.");
      return;
    }
    setError("");
    // Commit the dates that will drive fetching
    setAppliedDates({ from: fromDate, to: toDate });
  };

  const onClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedDates(null); // go back to range mode
    setError("");
  };

  if (error) return <p>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  const chartData = [
    { name: "Total Orders", value: stats.totalOrders },
    { name: "Completed", value: stats.completedOrders },
    { name: "Canceled", value: stats.canceledOrders },
  ];

  return (
    <div className={styles.statsPage}>
      <div className={styles.statsWrapper}>
        <h1>📊 Website Statistics</h1>

        {/* Quick ranges */}
        <div className={styles.rangeSelector}>
          <label>Quick Range:</label>
          <select
            value={range}
            onChange={(e) => {
              setRange(Number(e.target.value));
              // moving to quick range mode -> forget any applied custom dates
              setAppliedDates(null);
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Custom date filter (not in a <form>) */}
        <div className={styles.dateRange}>
          <label>From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <label>To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <button type="button" className={styles.applyBtn} onClick={onApply}>
            Apply
          </button>
          <button type="button" className={styles.clearBtn} onClick={onClear}>
            Clear
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.card}><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
          <div className={styles.card}><h3>Completed Orders</h3><p>{stats.completedOrders}</p></div>
          <div className={styles.card}><h3>Canceled Orders</h3><p>{stats.canceledOrders}</p></div>
          <div className={styles.card}><h3>Total Revenue</h3><p>${Number(stats.revenue || 0).toFixed(2)}</p></div>
          <div className={styles.card}><h3>Top Book Ordered</h3><p>{stats.topBook?.title || 'N/A'}</p></div>
          <div className={styles.card}><h3>Top Customer With Most Orders</h3><p>{stats.topCustomer?.name || 'N/A'}</p></div>
        </div>

        <br>
        </br>
        <br>
        </br>

        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#2196F3" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
