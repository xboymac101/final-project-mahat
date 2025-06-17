import React, { useEffect, useState } from 'react';
import styles from './Rules.module.css';
import axios from 'axios';

function RulesPage() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    axios.get('/api/rules')
      .then(res => setRules(res.data))
      .catch(err => console.error("Failed to fetch rules:", err));
  }, []);

  return (
    <div className={styles.rulesContainer}>
      <div className={styles.rulesCard}>
        <h2 className={styles.title}>📚 Library & Website Rules</h2>
        <ol className={styles.rulesList}>
          {rules.map((rule, idx) => (
            <li key={rule.rule_id} className={styles.ruleItem}>
              {rule.rule_text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default RulesPage;
