import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/img/logo.png';
import { FaShoppingCart, FaHammer, FaCog } from 'react-icons/fa'; 
import axios from 'axios';
import styles from './header.module.css';

function Header() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); 
  const isStaff = role === 'Staff';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = () => {
      axios.get('/api/auth/me', { withCredentials: true })
        .then(res => {
          setRole(res.data.role);
          setLoading(false);
        })
        .catch(() => {
          setRole(null);
          setLoading(false);
        });
    };

    const timeoutId = setTimeout(fetchUser, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleAdminSelect = (path) => {
    setShowAdminMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    axios.post('/api/auth/logout', {}, { withCredentials: true })
      .then(() => {
        setRole(null);
        navigate('/');
      })
      .catch(() => alert("Logout failed."));
  };

  return (
    <header>
      <div className='container'>
        <div className='header__wrap'>
          <div className='logo'>
            <NavLink to='/books' className='menu-item'>
              <img src={logo} alt='logo' />
              <span className='slogan'>BookHaven</span>
            </NavLink>
          </div>
          <nav>
            <ul className='menu'>
              <li><NavLink to='/books' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'} end>Home</NavLink></li>
              <li><NavLink to='/about' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>About</NavLink></li>
              <li><NavLink to='/categories' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>Categories</NavLink></li>
              <li><NavLink to='/rules' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>Rules</NavLink></li>

              {!loading && role === 'Regular' && (
                <>
                  <li>
                    <NavLink to='/my-orders' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>My Orders</NavLink>
                  </li>
                  <li>
                    <NavLink to='/shoppingcart' className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}>
                      <FaShoppingCart size={22} />
                    </NavLink>
                  </li>
                </>
              )}

              {!loading && (role === 'Admin' || role === 'Staff') && (
                <li className={styles.adminIcon}>
                  <FaHammer
                    size={20}
                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                    className={styles.hammer}
                  />
                  {showAdminMenu && (
                    <div className={styles.adminDropdown}>
                      <button onClick={() => handleAdminSelect('/admin/orders')}>📦 Orders</button>
                      <button onClick={() => handleAdminSelect('/admin/email-replies')}>📧 Email Replies</button>
                      {role === 'Admin' && (
                        <>
                        <button onClick={() => handleAdminSelect('/admin/stats')}>📊 Statistics</button>
                        <button onClick={() => handleAdminSelect('/admin/discounts')}>💸 Manage Discounts</button>
                       </>
                    )}
                    </div>
                  )}
                </li>
              )}

              {/* 🔄 Gear icon menu for everyone (user, staff, admin) */}
              {!loading && (
                <li className={styles.userIcon}>
                  <FaCog
                    size={20}
                    className={styles.gear}
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  />
                  {showUserMenu && (
                    <div className={styles.userDropdown}>
                      <button onClick={() => navigate('/edit-profile')}>🛠 Edit Profile</button>
                      <button onClick={handleLogout}>🚪 Logout</button>
                    </div>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
