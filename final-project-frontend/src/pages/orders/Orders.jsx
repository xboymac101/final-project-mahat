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
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [expanded, setExpanded] = useState({}); 

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

  useEffect(() => {
    fetchOrders(currentPage, searchTerm, statusFilter);
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
          items: [],
        };
      }
      grouped[item.order_id].items.push({
        title: item.book_title,
        type: item.type, // "rent" | "buy"
        quantity: item.quantity,
        due_date: item.due_date, // null for buys
      });
    }
    return Object.values(grouped);
  }

  // Helpers
  function hasRent(order) {
    return order.items?.some((i) => i.type === "rent");
  }
  function hasBuy(order) {
    return order.items?.some((i) => i.type === "buy");
  }
  function orderType(order) {
    const r = hasRent(order);
    const b = hasBuy(order);
    if (r && b) return "Mixed";
    return r ? "Rent" : "Buy";
  }
  function typeClass(order) {
    const t = orderType(order).toLowerCase(); // 'rent' | 'buy' | 'mixed'
    return styles[t] || "";
  }
  function firstDueDate(order) {
    const d = order.items.find((i) => i.type === "rent" && i.due_date)?.due_date;
    return d ? d.slice(0, 10) : "-";
  }
  function itemsCount(order) {
    return (
      order.items?.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0) || 0
    );
  }

  function handleSave(order) {
    const payload = { status: editedStatus };
    if (hasRent(order)) payload.due_date = editedDueDate; // only send for rent
    axios
      .put(`/api/admin/orders/${order.order_id}`, payload, {
        withCredentials: true,
      })
      .then(() => {
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
    setCurrentPage(1);
  }

  function resetFilters() {
    setSearchTerm("");
    setStatusFilter("");
    setCurrentPage(1);
  }

  function toggle(orderId) {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
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
            setCurrentPage(1);
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
          {groupedOrders.map((order) => {
            const isOpen = !!expanded[order.order_id];
            const rentExists = hasRent(order);

            return (
              <li key={order.order_id} className={styles.orderItem}>
                {/* Simple Row */}
                <div className={styles.simpleRow}>
                  <div className={styles.simpleLeft}>
                    <span className={styles.orderId}>#{order.order_id}</span>
                    <span className={styles.customer}>
                      {order.customer_name}
                    </span>
                  </div>

                  {/* TAGS lane (fixed) + meta */}
                  <div className={styles.simpleMid}>
                    <div className={styles.tags}>
                      <span
                        className={`${styles.status} ${
                          styles[order.status?.toLowerCase?.() || ""]
                        }`}
                      >
                        {order.status}
                      </span>
                      <span className={`${styles.type} ${typeClass(order)}`}>
                        {orderType(order)}
                      </span>
                    </div>

                    <span className={styles.meta}>
                      {itemsCount(order)} items
                      {rentExists ? ` • Due: ${firstDueDate(order)}` : ""}
                    </span>
                  </div>

                  <div className={styles.simpleRight}>
                    <button
                      className={styles.moreBtn}
                      onClick={() => toggle(order.order_id)}
                      aria-expanded={isOpen}
                      aria-controls={`order-details-${order.order_id}`}
                    >
                      {isOpen ? "Less" : "More"}
                    </button>
                  </div>
                </div>

                {/* Details */}
                {isOpen && (
                  <div
                    id={`order-details-${order.order_id}`}
                    className={styles.details}
                  >
                    <div className={styles.detailsGrid}>
                      <div>
                        <h4>Customer</h4>
                        <div>
                          <strong>Email:</strong> {order.email}
                        </div>
                        <div>
                          <strong>Phone:</strong> {order.phone_number}
                        </div>
                        {order.extensions_used >= 2 && (
                          <div className={styles.extensionWarning}>
                            <em>
                              ⚠️ This rental has reached the maximum of 2
                              extensions.
                            </em>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4>Edit</h4>
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

                          {/* Only show Due Date controls if there is a rent item */}
                          {rentExists && (
                            <div>
                              <strong>Due Date:</strong>{" "}
                              {editingOrderId === order.order_id ? (
                                <input
                                  type="date"
                                  value={editedDueDate}
                                  onChange={(e) => setEditedDueDate(e.target.value)}
                                />
                              ) : (
                                firstDueDate(order)
                              )}
                            </div>
                          )}
                        </div>

                        <div className={styles.buttonGroup}>
                          {editingOrderId === order.order_id ? (
                            <button
                              onClick={() => handleSave(order)}
                              className={styles.saveButton}
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingOrderId(order.order_id);
                                setEditedStatus(order.status);
                                const rentDue =
                                  order.items.find(
                                    (i) => i.type === "rent" && i.due_date
                                  )?.due_date?.slice(0, 10) || "";
                                setEditedDueDate(rentDue);
                              }}
                              className={styles.editButton}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <h4 className={styles.itemsHeader}>Items</h4>
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
                            <td>
                              {item.type === "rent" && item.due_date
                                ? item.due_date.slice(0, 10)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className={styles.pagination}>
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
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
