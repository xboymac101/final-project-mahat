import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/img/Logo.png';
import { FaShoppingCart } from 'react-icons/fa';
function Header() {
  return (
    <header>
      <div className='container'>
        <div className='header__wrap'>
          <div className='logo'>
            <Link to='/books'>
              <img src={logo} alt='logo' /> 
              <span className='slogan'>BookHaven</span>
            </Link>
          </div>
          <nav>
            <ul className='menu'>
              <li>
                <NavLink
                  to='/books'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/about'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                >
                  About
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/categories'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                >
                  Categories
                </NavLink>
              </li>
              <li>
                <NavLink
                  to='/rules'
                  className={({ isActive }) =>
                    isActive ? 'menu-item active' : 'menu-item'
                  }
                  end
                >
                  Rules
                </NavLink>
                </li>
                <li>
                <NavLink
                   to='/'
                  className={({ isActive }) =>
                      isActive ? 'menu-item active' : 'menu-item'
                    }
                  >
                    
                  </NavLink>
              </li>
              <li>
                <NavLink
                   to='/shoppingcart'
                  className={({ isActive }) =>
                      isActive ? 'menu-item active' : 'menu-item'
                    }
                  >
                    <FaShoppingCart size={22} />
                  </NavLink>
              </li>
                <li>
                <NavLink
                   to='/'
                  className={({ isActive }) =>
                      isActive ? 'menu-item active' : 'menu-item'
                    }
                  >
                    Login
                  </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
