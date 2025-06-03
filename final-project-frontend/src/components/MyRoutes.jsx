import React from 'react';
import { Routes, Route } from 'react-router-dom';
import About from '../components/about/About';
import Categories from '../components/categories/Categories'
import Login from './login/Login';
import { useState } from 'react';
import HomePage from '../components/homepage/HomePage'
import BookDetails from '../components/bookdetails/BookDetails';
import Signup from './signup/Signup';
import Rules from './rules/Rules'
function MyRoutes() {
  const [isloggedin, setIsLoggedIn] = useState(false);
  return (
    <>
      
      <Routes>
        <Route path='/' element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/Signup' element={<Signup />} />
        <Route path='/books' element={<HomePage />} />
        <Route path='/book/:id' element={<BookDetails />} />
        <Route path="/categories" element={<Categories />} />
        <Route path='/about' element={<About />} />
        <Route path='/rules' element={<Rules />} />

      </Routes>
      
    </>
  );
}

export default MyRoutes;
