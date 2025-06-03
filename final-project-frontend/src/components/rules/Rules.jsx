import React from 'react';
import styles from './Rules.module.css';

const rules = [
  "Users are responsible for keeping books in good condition.",
  "If a book is returned damaged, the full replacement price will be charged.",
  "Late returns incur a fee of 2₪ per day. After 14 days, the book is considered lost.",
  "Lost books must be paid for in full.",
  "Reserved books must be picked up within 3 days, or the reservation will be canceled.",
  "Do not share your account with others.",
  "Sales are final for purchased books. Rented books must be returned in original condition.",
  "Be respectful to staff and other users.",
  "No food or drink near books.",
  "All outstanding fees must be paid before borrowing more books.",
  "A maximum of 5 books may be borrowed at one time.",
  "Website must not be used for illegal activities."
];

function RulesPage() {
  return (
    <div className={styles.rulesContainer}>
      <div className={styles.rulesCard}>
        <h2 className={styles.title}>📚 Library & Website Rules</h2>
        <ol className={styles.rulesList}>
          {rules.map((rule, idx) => (
            <li key={idx} className={styles.ruleItem}>
              {rule}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default RulesPage;
