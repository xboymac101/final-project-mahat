import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import styles from "./Stock.module.css";
import { useNavigate } from "react-router-dom";

export default function Stock() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);

  const [lowOnly, setLowOnly] = useState(false);
  const [lowThreshold, setLowThreshold] = useState(5);

  const [sortBy, setSortBy] = useState("quantity_in_stock");
  const [sortDir, setSortDir] = useState("asc");

  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  // For inline edit
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");

  // Fetch role and categories on mount 
  useEffect(() => {
    let mounted = true;
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        setRole(res.data.role || "");
      })
      .catch(() => {
        if (!mounted) return;
        setRole("");
      });
axios
  .get("/api/books/categories", { withCredentials: true }) // <- add this
  .then((res) => setCategories(res.data || []))
  .catch(() => setCategories([]));

    return () => {
      mounted = false;
    };
  }, []);

  // Build URL 
  const buildUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (lowOnly) {
      params.set("lowOnly", "1");
      params.set("threshold", String(lowThreshold || 0));
    }
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDir) params.set("sortDir", sortDir);
    return `/api/books/stock?${params.toString()}`;
  }, [page, limit, search, category, lowOnly, lowThreshold, sortBy, sortDir]);

  // Fetch data 
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    axios
      .get(buildUrl, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load stock."
        );
      })
      .finally(() => mounted && setLoading(false));

    
  }, [buildUrl]);

  // Guards 
  const isAdminOrStaff = role === "Admin" || role === "Staff";
  useEffect(() => {
  }, [role, isAdminOrStaff, navigate]);

  // Helpers 
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function onSort(col) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditQty(String(item.quantity_in_stock ?? 0));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditQty("");
  }

  function saveEdit(id) {
    const qtyNum = Math.max(0, parseInt(editQty, 10) || 0);
    setLoading(true);
    setError("");
    axios
      .put(
        `/api/books/${id}/stock`,
        { quantity_in_stock: qtyNum },
        { withCredentials: true }
      )
      .then(() => {
        // refresh
        setItems((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, quantity_in_stock: qtyNum } : x
          )
        );
        cancelEdit();
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message || err?.message || "Failed to update."
        );
      })
      .finally(() => setLoading(false));
  }

  function ExportCSV() {
    try {
      const header = [
        "ID",
        "Title",
        "Author",
        "Category",
        "Price",
        "QuantityInStock",
      ];
      const rows = items.map((b) => [
        b.id,
        safeCSV(b.title),
        safeCSV(b.author),
        safeCSV(b.category_name),
        String(b.price ?? ""),
        String(b.quantity_in_stock ?? 0),
      ]);
      const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock_page_${page}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Failed to export CSV.");
    }
  }

  function safeCSV(v) {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  // Render 
  if (!role) {
    return <div className={styles.wrap}>Checking permissions…</div>;
  }

  if (!isAdminOrStaff) {
    return (
      <div className={styles.wrap}>
        <h2>403 • Forbidden</h2>
        <p>You don’t have permission to view stock.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1>Books in Stock</h1>

      <div className={styles.toolbar}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search by title/author/ISBN…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          className={styles.select}
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id || c.name} value={c.id || c.name}>
              {c.name}
            </option>
          ))}
        </select>

        

        <button className={styles.btn} onClick={ExportCSV}>
          Export CSV
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => onSort("title")} role="button">
                Title {sortBy === "title" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => onSort("author")} role="button">
                Author {sortBy === "author" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th onClick={() => onSort("category_name")} role="button">
                Category{" "}
                {sortBy === "category_name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className={styles.right}>Price</th>
              <th onClick={() => onSort("quantity_in_stock")} role="button" className={styles.center}>
                Qty {sortBy === "quantity_in_stock" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th className={styles.center}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No books found.
                </td>
              </tr>
            )}

            {items.map((b) => {
              const isEditing = editingId === b.id;
              const low = (b.quantity_in_stock ?? 0) <= lowThreshold;
              return (
                <tr key={b.id} className={low ? styles.lowRow : ""}>
                  <td>{b.title}</td>
                  <td>{b.author}</td>
                  <td>{b.category_name}</td>
                  <td className={styles.right}>
                    {b.price != null ? `$${Number(b.price).toFixed(2)}` : "—"}
                  </td>
                  <td className={styles.center}>
                    {isEditing ? (
                      <input
                        className={styles.qtyInput}
                        type="number"
                        min={0}
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(b.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      b.quantity_in_stock ?? 0
                    )}
                  </td>
                  <td className={styles.center}>
                    {isEditing ? (
                      <>
                        <button
                          className={styles.btnPrimary}
                          onClick={() => saveEdit(b.id)}
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button className={styles.btn} onClick={cancelEdit}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={styles.btn}
                          onClick={() => startEdit(b)}
                          disabled={loading}
                        >
                          Edit qty
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.footerRow}>
        <div className={styles.pagination}>
          <button
            className={styles.btn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page} / {totalPages} • {total} total
          </span>
          <button
            className={styles.btn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>

        <select
          className={styles.select}
          value={limit}
          onChange={(e) => {
            setPage(1);
            setLimit(parseInt(e.target.value, 10));
          }}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading…</div>}
    </div>
  );
}
