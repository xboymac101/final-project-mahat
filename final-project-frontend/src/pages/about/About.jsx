import React, { useState } from "react";
import styles from "./About.module.css";
import axios from "axios";

import founder1 from "../../assets/img/NourPic.jpeg";
import founder2 from "../../assets/img/RulaPic.jpeg";

function AboutPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const res = await axios.post("/api/email/contact", formData);
      setStatus(res.data.message || "Message sent!");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setStatus("Failed to send message.");
    }
  };

  return (
    <div className={styles.aboutContainer}>
      <div className={styles.grid}>
        <div className={styles.left}>
          <h1>About</h1>
          <p>
            BookHaven was founded by a small group of passionate readers, dreamers, and lifelong learners who believe in the power of books to transform lives. What started as late-night conversations over favorite novels turned into a shared mission: to create an online space where anyone, anywhere, can discover books they love.
          </p>
          <p>
            Coming from different backgrounds — literature, tech, design, and even a bit of coffee-shop philosophy — the founders combined their strengths to build more than just a bookstore. They wanted a community. A place that celebrates storytelling, supports indie authors, and helps readers find books that truly resonate.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <h2>Contact Us</h2>
            <div className={styles.formRow}>
              <div>
                <label>First name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  required
                />
              </div>
              <div>
                <label>Last name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Smitherton"
                  required
                />
              </div>
            </div>
            <label>Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@janesfakedomain.net"
              required
            />
            <label>Your message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter your question or message"
              rows={4}
              required
            />
            <button type="submit">Submit</button>
            {status && (
            <p className={status.includes("success") ? styles.success : styles.error}>
              {status}
            </p>
          )}
          </form>
        </div>

        <div className={styles.right}>
          <img src={founder1} alt="Founder 1" className={styles.founderImg} />
          <img src={founder2} alt="Founder 2" className={styles.founderImg} />
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
