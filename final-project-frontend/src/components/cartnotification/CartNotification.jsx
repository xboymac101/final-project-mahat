// components/cartnotification/CartNotification.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = () => {
    
    axios.get("/api/cart", { withCredentials: true })
      .then(res => {
        
        const totalItems = res.data.reduce((sum, item) => sum + item.amount, 0); 
        setCartCount(totalItems);
      })
      .catch(() => setCartCount(0));
      
  };

  useEffect(() => {
    fetchCartCount();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
