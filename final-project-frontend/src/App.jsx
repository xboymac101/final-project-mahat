import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import MyRoutes from "./components/MyRoutes";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { CartProvider } from './components/cartnotification/CartNotification';
import axios from "axios";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios.get("/api/auth/me", { withCredentials: true })
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div className="app-wrapper">
      <BrowserRouter>
        <CartProvider>
          {isLoggedIn && <Header />}
          <MyRoutes isLoggedIn={isLoggedIn} />
          {isLoggedIn && <Footer />}
        </CartProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
