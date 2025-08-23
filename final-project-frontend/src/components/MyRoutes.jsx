import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AboutPage from '../pages/about/About';
import Categories from '../pages/categories/Categories';
import Login from '../pages/login/Login';
import Signup from '../pages/signup/Signup';
import HomePage from '../pages/homepage/HomePage';
import BookDetails from '../pages/bookdetails/BookDetails';
import Rules from '../pages/rules/Rules';
import ProtectedRoute from '../components/protectedroute/ProtectedRoute'; 
import ShoppingCart from '../pages/shoppingcart/ShoppingCart';
import Orders from '../pages/orders/Orders';
import Stats from '../pages/stats/Stats';
import OrderHistory from '../pages/orderhistory/OrderHistory';
import ThankYou from '../pages/thankyou/ThankYou';
import EditProfile from '../pages/editprofile/EditProfile';
import EditBooks from '../components/editbooks/EditBooks';
import Discounts from '../pages/discounts/Discounts';
import StaffEmailReplies from "../pages/staffemailreplies/StaffEmailReplies";
import SearchPage from '../pages/searchpage/SearchPage'; 
import Profile from "../pages/profile/Profile";

function MyRoutes({ isLoggedIn }) {
  return (
    <Routes>
      {!isLoggedIn ? (
        <>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login />} />
        </>
      ) : (
        <>
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/book/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
          <Route path="/edit-book/:id" element={<ProtectedRoute requireStaffOrAdmin={true}><EditBooks /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute requireRegularOnly={true}><OrderHistory /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/thank-you" element={<ProtectedRoute><ThankYou /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute requireRegularOnly={true}><AboutPage /></ProtectedRoute>} />
          <Route path="/shoppingcart" element={<ProtectedRoute requireRegularOnly={true}><ShoppingCart /></ProtectedRoute>} />
          <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
          <Route path="/admin/discounts" element={<ProtectedRoute requireAdmin={true}><Discounts /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute requireStaffOrAdmin={true}><Orders /></ProtectedRoute>} />
          <Route path="/admin/email-replies" element={<ProtectedRoute requireStaffOrAdmin={true}><StaffEmailReplies /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute requireAdmin={true}><Stats /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </>
      )}
    </Routes>
  );
}

export default MyRoutes;
