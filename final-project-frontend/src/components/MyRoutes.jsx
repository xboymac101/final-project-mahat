import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AboutPage from '../components/about/About';
import Categories from '../components/categories/Categories';
import Login from './login/Login';
import HomePage from '../components/homepage/HomePage';
import BookDetails from '../components/bookdetails/BookDetails';
import Signup from './signup/Signup';
import Rules from './rules/Rules';
import ProtectedRoute from '../components/protectedroute/ProtectedRoute'; 
import ShoppingCart from '../components/shoppingcart/ShoppingCart';
function MyRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Routes>
      <Route path='/' element={<Login setIsLoggedIn={setIsLoggedIn} />} />
      <Route path='/Signup' element={<Signup />} />
      {/* Protected Routes */}
      <Route
        path='/books'
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path='/book/:id'
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <BookDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path='/about'
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <AboutPage/>
          </ProtectedRoute>
        }
      />
            <Route
        path='/shoppingcart'
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <ShoppingCart />
          </ProtectedRoute>
        }
      />
      <Route
        path='/rules'
        element={
          <ProtectedRoute isLoggedIn={isLoggedIn}>
            <Rules />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default MyRoutes;
