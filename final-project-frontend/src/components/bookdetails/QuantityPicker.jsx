import { useState } from "react";
import styles from './QuantityPicker.module.css';
export default function QuantityPicker({ maxCount = 0, onChange }) {
  const [count, setCount] = useState(0);

  const handleIncrease = () => {
    if (count < maxCount) {
      const newCount = count + 1;
      setCount(newCount);
      onChange && onChange(newCount); // call parent function if needed
    }
  };

  const handleDecrease = () => {
    if (count > 0) {
      const newCount = count - 1;
      setCount(newCount);
      onChange && onChange(newCount);
    }
  };

  return (
    <div className={styles.quantityPicker}>
      <button
        onClick={handleDecrease}
        disabled={count === 0}
        className={styles.button}
      >
        –
      </button>

      <span className={styles.count}>{count}</span>

      <button
        onClick={handleIncrease}
        disabled={count === maxCount}
        className={styles.button}
      >
        +
      </button>
    </div>
  );
}
