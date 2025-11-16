import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // Quick range state
  const [range, setRange] = useState(30);

  // Live inputs (not yet applied)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // The dates that were actually applied (drive fetching)
  const [appliedDates, setAppliedDates] = useState(null); // { from, to } | null

  const navigate = useNavigate();

  // Adjust these if your routes differ
  const ORDERS_PATH = "/admin/orders";
  const STOCK_PATH = "/stock";

  // Build a query string that preserves the current date filter
  const buildQS = (extra = {}) => {
    const qs = new URLSearchParams();
    if (appliedDates?.from && appliedDates?.to) {
      qs.set("fromDate", appliedDates.from);
      qs.set("toDate", appliedDates.to);
    } else {
      qs.set("range", String(range));
    }
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    return `?${qs.toString()}`;
  };

  // Navigate helpers
  const goToOrders = (status) =>
    navigate(`${ORDERS_PATH}${buildQS(status ? { status } : {})}`);
  const goToOutOfStock = () =>
    navigate(`${STOCK_PATH}${buildQS({ filter: "out-of-stock" })}`);

  // Fetch whenever quick range changes OR applied dates change
  useEffect(() => {
    const url =
      appliedDates?.from && appliedDates?.to
        ? `/api/admin/stats?fromDate=${appliedDates.from}&toDate=${appliedDates.to}`
        : `/api/admin/stats?range=${range}`;

    setError("");
    setStats(null);

    axios
      .get(url)
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
    setAppliedDates({ from: fromDate, to: toDate });
  };

  const onClear = () => {
    setFromDate("");
    setToDate("");
    setAppliedDates(null); // back to range mode
    setError("");
  };

  const chartData = stats
    ? [
        { name: "Total Orders", value: stats.totalOrders },
        { name: "Completed", value: stats.completedOrders },
        { name: "Pending", value: stats.pendingOrders || 0 },
        { name: "Canceled", value: stats.canceledOrders },
      ]
    : [];

  return (
    <div className={styles.statsPage}>
      {/* Error popup overlay */}
      {error && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorPopup}>
            <p>{error}</p>
            <button onClick={() => setError("")}>Close</button>
          </div>
        </div>
      )}

      <div className={styles.statsWrapper}>
        <h1>📊 Analytics</h1>

        {/* Quick ranges */}
        <div className={styles.rangeSelector}>
          <label>Quick Range:</label>
          <select
            value={range}
            onChange={(e) => {
              setRange(Number(e.target.value));
              // switching to quick range clears any applied custom dates
              setAppliedDates(null);
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Custom date filter */}
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

        {/* Content: loading or stats */}
        {!stats ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.card}>
                <h3>Total Orders</h3>
                <button
                  className={styles.numLink}
                  onClick={() => goToOrders()}
                >
                  {stats.totalOrders}
                </button>
              </div>

              <div className={styles.card}>
                <h3>Completed Orders</h3>
                <button
                  className={styles.numLink}
                  onClick={() => goToOrders("Completed")}
                >
                  {stats.completedOrders}
                </button>
              </div>

              <div className={styles.card}>
                <h3>Pending Orders</h3>
                <button
                  className={styles.numLink}
                  onClick={() => goToOrders("Pending")}
                >
                  {stats.pendingOrders || 0}
                </button>
              </div>

              <div className={styles.card}>
                <h3>Canceled Orders</h3>
                <button
                  className={styles.numLink}
                  onClick={() => goToOrders("Canceled")}
                >
                  {stats.canceledOrders}
                </button>
              </div>

              <div className={styles.card}>
                <h3>Total Revenue</h3>
                <p>${Number(stats.revenue || 0).toFixed(2)}</p>
              </div>

              <div className={styles.card}>
                <h3>Books Out of Stock</h3>
                <button className={styles.numLink} onClick={goToOutOfStock}>
                  {stats.outOfStockBooks || 0}
                </button>
              </div>

              <div className={styles.card}>
                <h3>Top Book Ordered</h3>
                <p>{stats.topBook?.title || "N/A"}</p>
              </div>

              <div className={styles.card}>
                <h3>Top Customer With Most Orders</h3>
                <p>{stats.topCustomer?.name || "N/A"}</p>
              </div>
            </div>

            <br />
            <br />

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
          </>
        )}
      </div>
    </div>
  );
}
