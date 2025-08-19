// App.jsx
import { useEffect, useState, useMemo } from "react";
import { BrowserRouter } from "react-router-dom";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import MyRoutes from "./components/MyRoutes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CartProvider } from "./components/cartnotification/CartNotification";
import axios from "axios";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios.get("/api/auth/me", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const paypalOptions = useMemo(() => ({
    "client-id": process.env.REACT_APP_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",        // must be lowercase
    components: "buttons",
  }), []);

  return (
    <div className="app-wrapper">
      <BrowserRouter>
        <PayPalScriptProvider options={paypalOptions}>
          <CartProvider isLoggedIn={isLoggedIn}>
            {isLoggedIn && <Header setIsLoggedIn={setIsLoggedIn} />}
            <div className="main-content">
              <MyRoutes isLoggedIn={isLoggedIn} />
            </div>
            {isLoggedIn && <Footer isLoggedIn={isLoggedIn} />}
          </CartProvider>
        </PayPalScriptProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
