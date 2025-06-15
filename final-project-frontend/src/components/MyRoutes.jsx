import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AboutPage from '../pages/about/About';
import Categories from '../pages/categories/Categories';
import Login from '../pages/login/Login';
import HomePage from '../pages/homepage/HomePage';
import BookDetails from '../pages/bookdetails/BookDetails';
import Signup from '../pages/signup/Signup';
import Rules from '../pages/rules/Rules';
import ProtectedRoute from '../components/protectedroute/ProtectedRoute'; 
import ShoppingCart from '../pages/shoppingcart/ShoppingCart';
import Orders from '../pages/orders/Orders'
function MyRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Routes>
      <Route path='/' element={<Login />} />
      <Route path='/Signup' element={<Signup />} />
      {/* Protected Routes */}
      <Route
        path='/books'
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/book/:id'
        element={
          <ProtectedRoute>
            <BookDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path='/about'
        element={
          <ProtectedRoute>
            <AboutPage/>
          </ProtectedRoute>
        }
      />
            <Route
        path='/shoppingcart'
        element={
          <ProtectedRoute>
            <ShoppingCart />
          </ProtectedRoute>
        }
      />
      <Route
        path='/rules'
        element={
          <ProtectedRoute>
            <Rules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requireAdmin={true}>
            <Orders />
          </ProtectedRoute>
        }
/>
    </Routes>
  );
}

export default MyRoutes;
