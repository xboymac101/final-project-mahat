import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function PayPalButton({ amount, setCart, fetchCartCount }) {
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
  const navigate = useNavigate();

  const amountStr = useMemo(() => {
    const n = typeof amount === "number" ? amount : parseFloat(amount || 0);
    return (isFinite(n) ? n : 0).toFixed(2);
  }, [amount]);

  if (!clientId) {
    console.error("Missing REACT_APP_PAYPAL_CLIENT_ID");
    return <div style={{ color: "crimson" }}>⚠️ PayPal client ID missing.</div>;
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": clientId,
        currency: "USD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        forceReRender={[amountStr]}
        createOrder={(data, actions) => {
          if (parseFloat(amountStr) <= 0) {
            return Promise.reject(new Error("Amount must be greater than zero"));
          }
          return actions.order.create({
            purchase_units: [{ amount: { value: amountStr }, description: "Book Order" }],
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
                setCart([]);
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
          alert("PayPal failed to initialize. Check console for details.");
        }}
      />
    </PayPalScriptProvider>
  );
}
