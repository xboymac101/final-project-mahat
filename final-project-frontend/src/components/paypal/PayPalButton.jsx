// components/paypal/PayPalButton.jsx
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PayPalButton({ amount, setCart, fetchCartCount }) {
  const navigate = useNavigate();

  const amountStr = useMemo(() => {
    const n = typeof amount === "number" ? amount : parseFloat(amount || 0);
    return (isFinite(n) ? n : 0).toFixed(2);
  }, [amount]);

  if (!amount || parseFloat(amountStr) <= 0) return null;

  return (
    <div style={{ maxWidth: 420 }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        forceReRender={[Number(amountStr)]} // rerenders buttons without reloading SDK
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              { amount: { value: amountStr }, description: "Book Order" },
            ],
          });
        }}
        onApprove={(data, actions) =>
          actions.order.capture().then((details) =>
            fetch("/api/order/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ paymentDetails: details }),
            })
              .then(async (res) => {
                if (!res.ok) {
                  const b = await res.json().catch(() => ({}));
                  throw new Error(b.message || `Order creation failed (${res.status})`);
                }
                return res.json();
              })
              .then(() => {
                setCart?.([]);
                fetchCartCount?.();
                navigate("/thank-you");
              })
              .catch((err) => {
                console.error("[/api/order/create]", err);
                alert(err.message || "Payment succeeded but order creation failed.");
              })
          )
        }
        onError={(err) => {
          console.error("[PayPal onError]", err);
          alert("PayPal failed to initialize. Please try again.");
        }}
      />
    </div>
  );
}
