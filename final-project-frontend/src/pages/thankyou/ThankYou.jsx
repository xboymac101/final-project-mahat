import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "./ThankYou.module.css"; // create this css file

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.icon}>🌿</div>
        <h2 className={styles.heading}>Thank You for Your Order!</h2>
        <p className={styles.text}>
          Your order was placed successfully.<br />
          You’ll receive a confirmation email soon.
        </p>
        <p className={styles.redirect}>Redirecting you to the homepage...</p>
        <Link to="/" className={styles.btn}>Back to Home Now</Link>
      </div>
    </div>
  );
}
