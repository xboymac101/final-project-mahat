import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useNavigate } from "react-router-dom";

export default function PayPalButton({ amount, cart, setCart, fetchCartCount }) {
  const clientId = process.env.REACT_APP_PAYPAL_CLIENT_ID;
  const navigate = useNavigate();

  return (
    <PayPalScriptProvider options={{ "client-id": clientId }}>
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: { value: amount.toFixed(2) },
                description: "Book Order",
              },
            ],
          });
        }}
       onApprove={(data, actions) => {
        return actions.order.capture().then((details) => {
          setTimeout(() => {
            fetch("/api/order/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ cart, paymentDetails: details }),
            })
              .then(res => res.json())
              .then(() => {
                setCart([]);
                fetchCartCount(); 
                navigate("/thank-you");
              })
              .catch(() => alert("Payment succeeded but order creation failed."));
          }, 300);
        });
      }}
      />
    </PayPalScriptProvider>
  );
}