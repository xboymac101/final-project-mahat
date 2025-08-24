import React, { useEffect, useState } from "react";
import axios from "axios";
import classes from "./Profile.module.css";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    role: "" // important for deciding what to render
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [insights, setInsights] = useState({
    favoriteBook: null,         // { book_id, title, author, image_url, total_orders }
    favoriteCategory: null,     // { name, total_bought }
    popularBooks: [],           // [{ book_id, title, author, total_orders }]
    popularCategories: []       // [{ name, total_bought }]
  });
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then(async (res) => {
        const info = res.data || {};
        setUser((prev) => ({ ...prev, ...info }));
        // If /api/auth/info doesn't include role, fetch it from /api/auth/me
        if (!info.role) {
          try {
            const r2 = await axios.get("/api/auth/me", { withCredentials: true });
            if (r2?.data?.role) {
              setUser((prev) => ({ ...prev, role: r2.data.role }));
            }
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        alert("Failed to load profile.");
      })
      .finally(() => setLoading(false));

    // Load stats (backend returns favorites for Regular, popular for everyone)
    setLoadingInsights(true);
    axios
      .get("/api/profile/stats", { withCredentials: true })
      .then((res) => {
        const data = res.data || {};
        setInsights({
          favoriteBook: data.favoriteBook ?? null,
          favoriteCategory: data.favoriteCategory ?? null,
          popularBooks: Array.isArray(data.popularBooks) ? data.popularBooks : [],
          popularCategories: Array.isArray(data.popularCategories) ? data.popularCategories : []
        });
      })
      .catch(() => {
        setInsights({
          favoriteBook: null,
          favoriteCategory: null,
          popularBooks: [],
          popularCategories: []
        });
      })
      .finally(() => setLoadingInsights(false));
  }, []);

  function onChange(e) {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function onSave(e) {
    e.preventDefault();
    axios
      .put("/api/auth/update-profile", user, { withCredentials: true })
      .then((res) => {
        setMsg(res.data.message || "Profile updated.");
        setEditing(false);
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => alert("Update failed."));
  }

  function onCancel() {
    setLoading(true);
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then((res) => {
        setUser((prev) => ({ ...prev, ...(res.data || {}) }));
        setEditing(false);
      })
      .finally(() => setLoading(false));
  }

  if (loading) return <div className={classes.loader}>Loading…</div>;

  const isRegular = user.role === "Regular";

  return (
    <div className={classes.page}>
      {/* Profile Card */}
      <div className={classes.card}>
        <div className={classes.headerRow}>
          <div className={classes.avatar} aria-hidden="true">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className={classes.titleBlock}>
            <h2 className={classes.title}>My Profile</h2>
            <p className={classes.subtitle}>View and update your account details</p>
          </div>
          <div className={classes.actions}>
            {!editing ? (
              <button className={classes.primaryBtn} onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <>
                <button className={classes.primaryBtn} onClick={onSave}>Save</button>
                <button className={classes.ghostBtn} onClick={onCancel}>Cancel</button>
              </>
            )}
          </div>
        </div>

        {msg && <div className={classes.success}>{msg}</div>}

        <form onSubmit={onSave} className={classes.form}>
          <div className={classes.grid}>
            <label className={classes.field}>
              <span>Name</span>
              <input
                name="name"
                value={user.name || ""}
                onChange={onChange}
                disabled={!editing}
                required
              />
            </label>

            <label className={classes.field}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={user.email || ""}
                onChange={onChange}
                disabled={!editing}
                required
              />
            </label>

            <label className={classes.field}>
              <span>Phone</span>
              <input
                name="phone_number"
                value={user.phone_number || ""}
                onChange={onChange}
                disabled={!editing}
                placeholder="+972 5X-XXXXXXX"
              />
            </label>

            <label className={classes.field + " " + classes.full}>
              <span>Address</span>
              <input
                name="address"
                value={user.address || ""}
                onChange={onChange}
                disabled={!editing}
                placeholder="Street, City"
              />
            </label>
          </div>

          {editing && (
            <div className={classes.editRow}>
              <button type="submit" className={classes.primaryBtn}>Save changes</button>
              <button type="button" className={classes.ghostBtn} onClick={onCancel}>Cancel</button>
            </div>
          )}
        </form>
      </div>

      {/* CUSTOMER (Regular): ONLY Favorites (no popular at all) */}
      {isRegular && (
        <div className={classes.card}>
          <div className={classes.headerRow}>
            <h3 className={classes.title} style={{ margin: 0 }}>Your Favorites</h3>
          </div>

          {loadingInsights ? (
            <div className={classes.loader}>Loading…</div>
          ) : (
            <>
              {/* Favorite Book (with image) */}
              <h4 className={classes.subsection}>Favorite Book</h4>
              {insights.favoriteBook ? (
                <div className={classes.bookCard}>
                  <div className={classes.bookThumb}>
                    {insights.favoriteBook.image_url ? (
                      <img src={insights.favoriteBook.image_url} alt={insights.favoriteBook.title} />
                    ) : (
                      <div className={classes.bookPlaceholder}>📚</div>
                    )}
                  </div>
                  <div className={classes.bookMeta}>
                    <div className={classes.bookTitle}>{insights.favoriteBook.title}</div>
                    <div className={classes.bookAuthor}>{insights.favoriteBook.author}</div>
                    <div className={classes.muted}>
                      Total orders: {insights.favoriteBook.total_orders}
                    </div>
                  </div>
                </div>
              ) : (
                <p className={classes.muted}>No purchases or rentals yet.</p>
              )}

              {/* Favorite Category */}
              <h4 className={classes.subsection}>Favorite Category</h4>
              {insights.favoriteCategory ? (
                <span className={classes.chip}>
                  {insights.favoriteCategory.name}
                  <span style={{ marginLeft: 8, fontWeight: 400 }} className={classes.muted}>
                    ({insights.favoriteCategory.total_bought} bought)
                  </span>
                </span>
              ) : (
                <p className={classes.muted}>No purchases yet.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* ADMIN/STAFF: ONLY Popular (no images) */}
      {!isRegular && (
        <div className={classes.card}>
          <div className={classes.headerRow}>
            <h3 className={classes.title} style={{ margin: 0 }}>Popular right now</h3>
          </div>

          {loadingInsights ? (
            <div className={classes.loader}>Loading…</div>
          ) : (
            <>
              {Array.isArray(insights.popularBooks) && insights.popularBooks.length > 0 && (
                <>
                  <h4 className={classes.subsection}>Books</h4>
                  <div className={classes.bookGrid}>
                    {insights.popularBooks.map((b) => (
                      <div key={b.book_id} className={classes.bookCard}>
                        <div className={classes.bookMeta}>
                          <div className={classes.bookTitle}>{b.title}</div>
                          <div className={classes.bookAuthor}>{b.author}</div>
                          <div className={classes.muted}>Total orders: {b.total_orders ?? 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {Array.isArray(insights.popularCategories) && insights.popularCategories.length > 0 && (
                <>
                  <h4 className={classes.subsection} style={{ marginTop: 8 }}>Categories</h4>
                  <div className={classes.chips}>
                    {insights.popularCategories.map((c) => (
                      <span key={c.name} className={classes.chip}>
                        {c.name}
                        <span className={classes.muted} style={{ marginLeft: 6 }}>
                          ({c.total_bought})
                        </span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
