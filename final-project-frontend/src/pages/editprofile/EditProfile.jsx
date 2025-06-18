import React, { useEffect, useState } from "react";
import axios from "axios";
import classes from "./EditProfile.module.css";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/api/auth/info", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => alert("Failed to load user data"));
  }, []);

  function handleChange(e) {
    setUser({ ...user, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    axios.put("/api/auth/update-profile", user, { withCredentials: true })
      .then(res => setMessage(res.data.message || "Updated successfully."))
      .catch(err => alert("Update failed."));
  }

  function handleLogout() {
    axios.post("/api/auth/logout", {}, { withCredentials: true })
      .then(() => navigate("/"))
      .catch(() => alert("Logout failed"));
  }

  return (
    <div className={classes.profileContainer}>
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit} className={classes.profileForm}>
        <label>Name:
          <input name="name" value={user.name || ''} onChange={handleChange} required />
        </label>
        <label>Email:
          <input name="email" type="email" value={user.email || ''} onChange={handleChange} required />
        </label>
        <label>Phone:
          <input name="phone_number" value={user.phone_number || ''} onChange={handleChange} />
        </label>
        <label>Address:
          <input name="address" value={user.address || ''} onChange={handleChange} />
        </label>
        <button type="submit">Save Changes</button>
        <button type="button" onClick={handleLogout} className={classes.logoutBtn}>Logout</button>
        {message && <div className={classes.message}>{message}</div>}
      </form>
    </div>
  );
} 
