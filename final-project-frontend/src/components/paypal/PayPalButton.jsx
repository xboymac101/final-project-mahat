
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PayPalButton({ amount, setCart, fetchCartCount }) {
  const navigate = useNavigate();
  const [payMsg, setPayMsg] = useState(""); // shows failed/canceled/success messages

  const amountStr = useMemo(() => {
    const n = typeof amount === "number" ? amount : parseFloat(amount || 0);
    return (isFinite(n) ? n : 0).toFixed(2);
  }, [amount]);

  if (!amount || parseFloat(amountStr) <= 0) return null;

  return (
    <div style={{ maxWidth: 420 }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        forceReRender={[Number(amountStr)]}
        createOrder={(data, actions) => {
          setPayMsg(""); 
          return actions.order.create({
            purchase_units: [
              { amount: { value: amountStr }, description: "Book Order" },
            ],
          });
        }}
        onApprove={(data, actions) =>
          actions.order
            .capture()
            .then((details) =>
              fetch("/api/order/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ paymentDetails: details }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const b = await res.json().catch(() => ({}));
                    throw new Error(
                      b.message || `Order creation failed (${res.status})`
                    );
                  }
                  return res.json();
                })
                .then(() => {
                  setCart?.([]);
                  fetchCartCount?.();
                  setPayMsg(""); 
                  navigate("/thank-you");
                })
            )
            .catch((err) => {
              console.error("[onApprove flow]", err);
              setPayMsg(
                "Payment succeeded but finalizing your order failed. Your card wasn’t charged twice. Please contact support or try again."
              );
            })
        }
        onCancel={() => {
          setPayMsg("Payment was canceled before completion.");
        }}
        onError={(err) => {
          const dbg =
            (err && (err.debug_id || err.debugId || err.debugID)) || null;
          console.error("[PayPal onError]", err);
          setPayMsg(
            `Payment failed to initialize or complete.${
              dbg ? " Debug ID: " + dbg + "." : ""
            } Please try again or use another method.`
          );
        }}
      />

      
      {payMsg && (
        <p
          style={{
            marginTop: 10,
            color: "crimson",
            fontSize: 14,
          }}
          role="alert"
          aria-live="polite"
        >
          {payMsg}
        </p>
      )}
    </div>
  );
}
