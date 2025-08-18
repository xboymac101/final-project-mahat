import { useEffect, useState } from "react";
import axios from "axios";
import classes from "./ShoppingCart.module.css";
import UserDetailsPopup from "../../components/userdetailspopup/UserDetailsPopup";
import PayPalButton from "../../components/paypal/PayPalButton";
import { useCart } from "../../components/cartnotification/CartNotification";

export default function ShoppingCart() {
  const [items, setItems] = useState([]);          // array of cart items
  const [subtotal, setSubtotal] = useState(0);     // numbers from server
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0.18);
  const [processing, setProcessing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const { fetchCartCount } = useCart();

  useEffect(() => {
    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((res) => {
        if (res.data.role === "Admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          checkUserDetails();
        }
      })
      .catch(() => setIsAdmin(false));

    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchCart() {
    setLoading(true);
    axios
      .get("/api/cart", { withCredentials: true })
      .then((res) => {
        const payload = res.data || {};
        const arr = Array.isArray(payload) ? payload : (payload.items || []);
        setItems(arr);
        setSubtotal(Number(payload.subtotal ?? 0));
        setTax(Number(payload.tax ?? 0));
        setTotal(Number(payload.total ?? 0));
        setTaxRate(Number(payload.tax_rate ?? 0.18));
        setMsg("");
      })
      .catch((err) => {
        console.error(err);
        setMsg(err.response?.data?.message || "Failed to load cart");
      })
      .finally(() => setLoading(false));
  }

  function checkUserDetails() {
    axios
      .get("/api/auth/info", { withCredentials: true })
      .then((res) => {
        const { phone_number, address } = res.data || {};
        if (!phone_number || !address) setShowPopup(true);
      })
      .catch((err) => {
        console.error("Failed to check user info:", err);
      });
  }

  function handleRemove(book_id, type) {
    axios
      .post("/api/cart/remove", { book_id, type }, { withCredentials: true })
      .then(() => {
        fetchCart();
        fetchCartCount();
      })
      .catch(() => alert("Error removing item"));
  }

  function handleDecrease(book_id, type) {
    if (processing) return;
    setProcessing(true);
    axios
      .post("/api/cart/decrease", { book_id, type }, { withCredentials: true })
      .then(() => {
        fetchCart();
        fetchCartCount();
        setProcessing(false);
      })
      .catch((err) => {
        alert("Failed to update. " + (err.response?.data?.message || ""));
        setProcessing(false);
      });
  }

  function handleIncrease(book_id, currentAmount, maxCount, type) {
    if (processing) return;
    setProcessing(true);

    // Enforce rent cap (client-side UX). Read from payload.items (object response).
    axios
      .get("/api/cart", { withCredentials: true })
      .then((res) => {
        const payload = res.data || {};
        const arr = Array.isArray(payload) ? payload : (payload.items || []);
        const rentalTotal = arr
          .filter((i) => i.type === "rent")
          .reduce((s, i) => s + Number(i.amount || 0), 0);

        const MAX_RENTALS = 5;
        if (type === "rent" && rentalTotal >= MAX_RENTALS) {
          alert(`You can only rent up to ${MAX_RENTALS} books.`);
          setProcessing(false);
          return;
        }

        axios
          .post(
            "/api/cart/add",
            { book_id, amount: 1, type },
            { withCredentials: true }
          )
          .then(() => {
            fetchCart();
            setTimeout(() => {
              fetchCartCount();
              setProcessing(false);
            }, 120);
          })
          .catch((err) => {
            alert("Error updating item: " + (err.response?.data?.message || ""));
            setProcessing(false);
          });
      })
      .catch(() => {
        alert("Failed to check cart.");
        setProcessing(false);
      });
  }

  function handleUpdateQty(book_id, type, newAmount) {
    const amount = Math.max(1, Number(newAmount) || 1);
    axios
      .post(
        "/api/cart/update",
        { book_id, type, amount },
        { withCredentials: true }
      )
      .then(() => {
        fetchCart();
        fetchCartCount();
      })
      .catch((err) => {
        alert("Error updating quantity: " + (err.response?.data?.message || ""));
      });
  }

  if (loading) {
    return <div className={classes["cart-container"]}><p>Loading cart...</p></div>;
  }

  return (
  <div className={classes["cart-container"]}>
    <h2>Your Cart</h2>

    {msg && <p style={{ color: "crimson", marginTop: 8 }}>{msg}</p>}

    {showPopup && <UserDetailsPopup onComplete={() => setShowPopup(false)} />}

    {isAdmin ? (
      <p>Admins are not allowed to make purchases.</p>
    ) : (
      <>
        {items.length === 0 ? (
          <p>Cart is empty.</p>
        ) : (
          <>
            <ul className={classes["cart-list"]}>
              {items.map((item) => {
                const unit = Number(item.unit_price);
                const lineTotal =
                  Math.round((unit * Number(item.amount || 0) + Number.EPSILON) * 100) / 100;

                return (
                  <li key={`${item.book_id}-${item.type}`} className={classes["cart-item"]}>
                    <img
                      src={item.image || "https://via.placeholder.com/60x85?text=No+Image"}
                      alt={item.title}
                      className={classes["cart-item-img"]}
                      onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/60x85?text=No+Image")}
                    />
                    <div className={classes["cart-item-details"]}>
                      <div className={classes["cart-item-title"]}>
                        {item.title}{" "}
                        <span className={classes["cart-item-type"]}>
                          ({item.type === "rent" ? "Rent" : "Buy"})
                        </span>
                      </div>

                      <div className={classes["cart-item-meta"]}>
                        <button
                          className={classes["dec-btn"]}
                          disabled={Number(item.amount) <= 1 || processing}
                          onClick={() => handleDecrease(item.book_id, item.type)}
                        >
                          -
                        </button>

                        <input
                          className={classes["cart-item-amount"]}
                          type="number"
                          min="1"
                          value={item.amount}
                          onChange={(e) => handleUpdateQty(item.book_id, item.type, e.target.value)}
                        />

                        <button
                          className={classes["inc-btn"]}
                          onClick={() => handleIncrease(item.book_id, item.amount, item.count, item.type)}
                          disabled={Number(item.amount) >= Number(item.count) || processing}
                        >
                          +
                        </button>

                        <span className={classes["cart-item-unit"]}>× ${unit.toFixed(2)}</span>
                      </div>

                      <div className={classes["cart-item-line"]}>
                        BookTotal: ${lineTotal.toFixed(2)}
                      </div>

                      <button
                        onClick={() => handleRemove(item.book_id, item.type)}
                        className={classes["remove-btn"]}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Summary (server-provided totals) */}
            <div className={classes["summary-card"]}>
              <div className={classes["summary-row"]}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={classes["summary-row"]}>
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr />
              <div className={classes["summary-row total"]}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* PayPal */}
            <div className={classes["paypal-wrapper"]}>
              {total <= 0 && <div>Total must be &gt; $0 to pay.</div>}
              {showPopup && (
                <div style={{ color: "crimson", marginBottom: 8 }}>
                  Finish your details to enable payment.
                </div>
              )}
              {total > 0 && !showPopup && (
                <PayPalButton amount={total} setCart={setItems} fetchCartCount={fetchCartCount} />
              )}
            </div>
          </>
        )}
      </>
    )}
  </div>
);

}
