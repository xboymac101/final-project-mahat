import React from 'react'
import classes from './footer.module.css';

export default function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.title}>Bookhaven</div>

      <div className={classes.icons}>
        <span>📘</span>
        <span>📷</span>
        <span>⚙️</span>
      </div>

      <p className={classes.copy}>
        Copyright© BookHaven 2025. All rights reserved.
      </p>
    </footer>
  );
}

