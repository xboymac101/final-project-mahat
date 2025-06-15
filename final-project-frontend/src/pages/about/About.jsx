import React from "react";
import styles from "./About.module.css";

// Replace these URLs with your actual images or use the uploaded ones
import founder1 from "../../assets/img/NourPic.jpeg"
import founder2 from "../../assets/img/RulaPic.jpeg"

function AboutPage() {
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
          <form className={styles.form}>
            <h2>Contact Us</h2>
            <div className={styles.formRow}>
              <div>
                <label>First name</label>
                <input type="text" placeholder="Jane" />
              </div>
              <div>
                <label>Last name</label>
                <input type="text" placeholder="Smitherton" />
              </div>
            </div>
            <label>Email address</label>
            <input type="email" placeholder="email@janesfakedomain.net" />
            <label>Your message</label>
            <textarea placeholder="Enter your question or message" rows={4}></textarea>
            <button type="submit">Submit</button>
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
