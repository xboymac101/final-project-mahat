import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ThankYou() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/books");
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, []);

  return <h2>✅ Thank you! Your order was placed successfully. Redirecting to home...</h2>;
}