import React from 'react';
import classes from './footer.module.css';

export default function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.container}>
        <div className={classes.title}>📚 BookHaven</div>

        <div className={classes.icons}>
          
          <span title="Instagram">📷@Bookhaven_Project</span>
          <span title="Email">✉️ projectbookhaven@gmail.com</span>
        </div>

        <p>Open daily  · Rent & Buy your favorite books</p>
        <p>© {new Date().getFullYear()} BookHaven. All rights reserved.</p>
      </div>
    </footer>
  );
}
