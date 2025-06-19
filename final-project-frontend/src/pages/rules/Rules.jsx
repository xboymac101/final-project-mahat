import React, { useEffect, useState } from 'react';
import styles from './Rules.module.css';
import axios from 'axios';

function RulesPage() {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    axios.get('/api/auth/me', { withCredentials: true })
      .then(res => setIsAdmin(res.data.role === 'Admin'))
      .catch(() => setIsAdmin(false));

    fetchRules();
  }, []);

  function fetchRules() {
    axios.get('/api/rules')
      .then(res => setRules(res.data))
      .catch(err => console.error("Failed to fetch rules:", err));
  }

  function handleAddRule(e) {
    e.preventDefault();
    if (!newRule.trim()) return;
    axios.post('/api/rules', { rule_text: newRule }, { withCredentials: true })
      .then(() => {
        setNewRule("");
        fetchRules();
      })
      .catch(() => alert("Failed to add rule"));
  }

  function handleDeleteRule(id) {
    if (!window.confirm("Delete this rule?")) return;
    axios.delete(`/api/rules/${id}`, { withCredentials: true })
      .then(() => fetchRules())
      .catch(() => alert("Failed to delete rule"));
  }

  return (
    <div className={styles.rulesContainer}>
      <div className={styles.rulesCard}>
        <h2 className={styles.title}>📚 Library & Website Rules</h2>
        <ol className={styles.rulesList}>
          {rules.map((rule) => (
            <li key={rule.rule_id} className={styles.ruleItem}>
              {rule.rule_text}
              {isAdmin && (
                <button className={styles.deleteBtn} onClick={() => handleDeleteRule(rule.rule_id)}>🗑</button>
              )}
            </li>
          ))}
        </ol>
        {isAdmin && (
          <form className={styles.addForm} onSubmit={handleAddRule}>
            <input
              type="text"
              placeholder="Enter new rule"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              className={styles.inputField}
              required
            />
            <button type="submit" className={styles.addButton}>➕ Add Rule</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RulesPage;
