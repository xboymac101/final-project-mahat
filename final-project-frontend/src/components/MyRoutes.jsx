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

function MyRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path='/' element={<MainPage />} />
        <Route path='/about' element={<About />} />
        <Route path='/post/:id' element={<SinglePost />} />
        <Route path='/test' element={<State />} />
        <Route path='/newpost' element={<NewPost />} />
      </Routes>
      <Footer />
    </>
  );
}

export default MyRoutes;
