import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./UserDetailsPopup.module.css";

export default function UserDetailsPopup({ onComplete }) {
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    axios.post("/api/auth/complete-profile", { phone, address })
      .then(() => {
        onComplete(); // will hide popup on success
      })
      .catch(() => {
        alert("Error updating your info.");
      });
  }

  return (
    <div className={styles.popupContainer}>
      <h3>You're almost there!</h3>
      <p>We just need your phone number and address.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className={styles.inputField}
        />
        <button type="submit" className={styles.submitButton}>Save & Continue</button>
      </form>
    </div>
  );
}
