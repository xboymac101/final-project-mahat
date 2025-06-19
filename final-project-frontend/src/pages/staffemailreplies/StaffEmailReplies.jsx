import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./StaffEmailReplies.module.css";
import { useNavigate } from "react-router-dom";

export default function StaffEmailReplies() {
const [staffId, setStaffId] = useState(null);
const [messages, setMessages] = useState([]);
const [selected, setSelected] = useState(null);
const [replyText, setReplyText] = useState("");
const [status, setStatus] = useState("");
const [filter, setFilter] = useState("all");
const navigate = useNavigate();

useEffect(() => {
  axios.get("/api/auth/me")
    .then(res => {
      if (res.data.role !== "Staff" && res.data.role !== "Admin") {
        navigate("/unauthorized");
      } else {
        setStaffId(res.data.user_id); // ✅ set the real staff ID
        fetchMessages();
      }
    })
    .catch(() => navigate("/unauthorized"));
}, []);
  const fetchMessages = () => {
    axios.get("/api/staff/emails")
      .then(res => setMessages(res.data))
      .catch(() => setStatus("Failed to fetch messages"));
  };

  
  const handleReply = (id) => {
    axios.post(`/api/staff/reply/${id}`, { replyText, staffId })
      .then(res => {
        setStatus(res.data.message);
        setReplyText("");
        setSelected(null);
        fetchMessages();
      })
      .catch(() => setStatus("Failed to send reply"));
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === "replied") return msg.is_replied;
    if (filter === "unreplied") return !msg.is_replied;
    return true;
  });

  return (
    <div className={styles.wrapper}>
      <h2>Customer Emails</h2>
      <div className={styles.filterRow}>
        <button className={filter === "all" ? styles.active : ""} onClick={() => setFilter("all")}>All</button>
        <button className={filter === "unreplied" ? styles.active : ""} onClick={() => setFilter("unreplied")}>Unreplied</button>
        <button className={filter === "replied" ? styles.active : ""} onClick={() => setFilter("replied")}>Replied</button>
      </div>
      {status && <p className={styles.status}>{status}</p>}
      <div className={styles.container}>
        <div className={styles.sidebar}>
          {filteredMessages.map(msg => (
            <div
              key={msg.id}
              className={styles.messageItem + (msg.is_replied ? ` ${styles.replied}` : "")}
              onClick={() => setSelected(msg)}
            >
              <strong>{msg.first_name} {msg.last_name}</strong>
              <p>{msg.email}</p>
              <p>{new Date(msg.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className={styles.detail}>
          {selected ? (
            <div>
              <h3>Message from {selected.first_name} {selected.last_name}</h3>
              <p><strong>Email:</strong> {selected.email}</p>
              <p><strong>Original Message:</strong></p>
              <p>{selected.message}</p>
              {selected.is_replied ? (
                <div>
                  <p><strong>Reply:</strong></p>
                  <p>{selected.reply}</p>
                </div>
              ) : (
                <div>
                  <textarea
                    rows={5}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                  ></textarea>
                  <button onClick={() => handleReply(selected.id)}>Send Reply</button>
                </div>
              )}
            </div>
          ) : (
            <p>Select a message to view and reply.</p>
          )}
        </div>
      </div>
    </div>
  );
}
