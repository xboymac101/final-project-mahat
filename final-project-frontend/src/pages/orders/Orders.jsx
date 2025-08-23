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
  const [statusFilter, setStatusFilter] = useState("Pending"); // default UI to Pending

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
        setOrders(res.data.orders || []);
        setTotalPages(res.data.totalPages || 1);
        setError("");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load orders.");
      });
  }

  // Fetch whenever page OR filters change (including initial render)
  useEffect(() => {
    fetchOrders(currentPage, searchTerm, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, searchTerm]);

  function groupOrdersById(flatOrders) {
    const grouped = {};
    for (const item of flatOrders) {
      if (!grouped[item.order_id]) {
        grouped[item.order_id] = {
          order_id: item.order_id,
          status: item.status,
          customer_name: item.customer_name,
          email: item.email,
          phone_number: item.phone_number,
          extensions_used: item.extensions_used || 0,
          items: []
        };
      }
      grouped[item.order_id].items.push({
        title: item.book_title,
        type: item.type,
        quantity: item.quantity,
        due_date: item.due_date
      });
    }
    return Object.values(grouped);
  }

  function handleSave(orderId) {
    axios
      .put(
        `/api/admin/orders/${orderId}`,
        { status: editedStatus, due_date: editedDueDate },
        { withCredentials: true }
      )
      .then(() => {
        // refetch with current filters & page
        fetchOrders(currentPage);
        setEditingOrderId(null);
        setEditedStatus("");
        setEditedDueDate("");
      })
      .catch((err) => {
        console.error("Failed to update order:", err);
        alert(err?.response?.data?.message || "Update failed");
      });
  }

  function handleFilterChange() {
    // invoked on Enter in search input
    setCurrentPage(1); // effect will refetch with updated searchTerm
  }

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
    // effect will refetch automatically
  }

  const groupedOrders = groupOrdersById(orders);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📦 Orders</h1>

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
            setStatusFilter(e.target.value);
            setCurrentPage(1); // refetch via effect
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

      {groupedOrders.length === 0 ? (
        <p className={styles.empty}>No orders found.</p>
      ) : (
        <ul className={styles.list}>
          {groupedOrders.map((order) => (
            <li key={order.order_id} className={styles.orderItem}>
              <div><strong>Order ID:</strong> {order.order_id}</div>
              <div><strong>Customer:</strong> {order.customer_name}</div>
              <div><strong>Email:</strong> {order.email}</div>
              <div><strong>Phone:</strong> {order.phone_number}</div>

              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.title || "-"}</td>
                      <td>{item.type || "-"}</td>
                      <td>{item.quantity ?? "-"}</td>
                      <td>{item.due_date ? item.due_date.slice(0, 10) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
                    order.items.find(i => i.due_date)?.due_date?.slice(0, 10) || "-"
                  )}
                </div>
              </div>

              {order.extensions_used >= 2 && (
                <div className={styles.extensionWarning}>
                  <em>⚠️ This rental has reached the maximum of 2 extensions.</em>
                </div>
              )}

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
                      setEditedDueDate(
                        order.items.find(i => i.due_date)?.due_date?.slice(0, 10) || ""
                      );
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
