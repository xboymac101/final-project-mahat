import React, { useEffect, useState } from "react";
import axios from "axios";
import classes from "./Profile.module.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: ""
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then((res) => {
        setUser(res.data || {});
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert("Failed to load profile.");
      });
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
    // Reload original values from server
    setLoading(true);
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then((res) => {
        setUser(res.data || {});
        setEditing(false);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setEditing(false);
      });
  }

  function onLogout() {
    axios
      .post("/api/auth/logout", {}, { withCredentials: true })
      .then(() => navigate("/"))
      .catch(() => alert("Logout failed."));
  }

  if (loading) return <div className={classes.loader}>Loading…</div>;

  return (
    <div className={classes.page}>
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
            <button className={classes.warnBtn} onClick={onLogout}>Logout</button>
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

      {/* Optional quick links section; remove if you don’t want */}
      <div className={classes.quickLinks}>
        <a href="/my-orders" className={classes.linkCard}>My Orders</a>
        <a href="/rules" className={classes.linkCard}>Rules</a>
        <a href="/categories" className={classes.linkCard}>Browse Categories</a>
      </div>
    </div>
  );
}
