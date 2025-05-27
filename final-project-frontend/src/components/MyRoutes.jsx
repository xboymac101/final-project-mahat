import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainPage from './MainPage';
import About from './About';
import Header from './Header';
import Footer from './Footer';
import SinglePost from './SinglePost';
import Main from './Main';
import State from './State';
import NewPost from './NewPost';
import Login from './login/Login';
import { useState } from 'react';
import HomePage from '../components/homepage/HomePage'
import BookDetails from './BookDetails';
function MyRoutes() {
  const [isloggedin, setIsLoggedIn] = useState(false);
  return (
    <>
      
      <Routes>
        <Route path='/' element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path='/books' element={<HomePage />} />
        <Route path='/book/:id' element={<BookDetails />} />
        <Route path='/about' element={<About />} />
        <Route path='/post/:id' element={<SinglePost />} />
        <Route path='/test' element={<State />} />
        <Route path='/newpost' element={<NewPost />} />
      </Routes>
      
    </>
  );
}

export default MyRoutes;
