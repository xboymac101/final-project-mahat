import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Orders.module.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editedStatus, setEditedStatus] = useState("");
  const [editedDueDate, setEditedDueDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const ordersPerPage = 5;

  function fetchOrders(page, search = searchTerm, status = statusFilter) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", ordersPerPage);
    if (search) params.append("search", search);
    if (status) params.append("status", status);

    axios
      .get(`/api/admin/orders?${params.toString()}`, { withCredentials: true })
      .then((res) => {
        setOrders(res.data.orders);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load orders.");
      });
  }
  useEffect(() => {
    fetchOrders(currentPage);
    // eslint-disable-next-line
  }, [currentPage]);

  function handleSave(orderId) {
    axios
      .put(
        `/api/admin/orders/${orderId}`,
        {
          status: editedStatus,
          due_date: editedDueDate
        },
        { withCredentials: true }
      )
      .then(() => {
        fetchOrders(currentPage);
        setEditingOrderId(null);
        setEditedStatus("");
        setEditedDueDate("");
      })
      .catch((err) => {
        console.error("Failed to update order:", err);
      });
  }

  function handleFilterChange() {
  setCurrentPage(1);
  fetchOrders(1);
  }


  function resetFilters() {
  setSearchTerm("");
  setStatusFilter("");
  setCurrentPage(1);
  fetchOrders(1, "", "");
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📦 Orders</h1>

      {/* 🔍 Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value);
            setCurrentPage(1);
            fetchOrders(1, searchTerm, value); 
          }}
          className={styles.selectInput}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Canceled">Canceled</option>
          <option value="Returned">Returned</option>
        </select>
        <button onClick={resetFilters} className={styles.resetButton}>
          Reset Filters
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {orders.length === 0 ? (
        <p className={styles.empty}>No orders found.</p>
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => (
            <li key={order.order_id} className={styles.orderItem}>
              <div><strong>Order ID:</strong> {order.order_id}</div>
              <div><strong>Customer:</strong> {order.customer_name}</div>
              <div><strong>Email:</strong> {order.email}</div>
              <div><strong>Phone:</strong> {order.phone_number}</div>
              <div><strong>Book:</strong> {order.book_title}</div>
              <div><strong>Type:</strong> {order.type}</div>

              <div className={styles.inlineFields}>
                <div>
                  <strong>Status:</strong>{" "}
                  {editingOrderId === order.order_id ? (
                    <select
                      value={editedStatus}
                      onChange={(e) => setEditedStatus(e.target.value)}
                    >
                      <option>Pending</option>
                      <option>Completed</option>
                      <option>Canceled</option>
                      <option>Returned</option>
                    </select>
                  ) : (
                    order.status
                  )}
                </div>

                <div>
                  <strong>Due Date:</strong>{" "}
                  {editingOrderId === order.order_id ? (
                    <input
                      type="date"
                      value={editedDueDate}
                      onChange={(e) => setEditedDueDate(e.target.value)}
                    />
                  ) : (
                    order.due_date?.slice(0, 10)
                  )}
                </div>
              </div>

              <div className={styles.buttonGroup}>
                {editingOrderId === order.order_id ? (
                  <button
                    onClick={() => handleSave(order.order_id)}
                    className={styles.saveButton}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingOrderId(order.order_id);
                      setEditedStatus(order.status);
                      setEditedDueDate(order.due_date?.slice(0, 10) || "");
                    }}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
