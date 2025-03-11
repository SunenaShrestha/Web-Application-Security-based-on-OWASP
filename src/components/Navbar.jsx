import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect } from 'react';
import AuthModal from './AuthModal';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, cartCount } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log('Current user in Navbar:', user);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const CartIcon = () => (
    <Link to="/cart" className="cart-icon-container">
      <div className="cart-icon">🛒</div>
      {cartCount > 0 && (
        <span className="cart-count">{cartCount}</span>
      )}
    </Link>
  );

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        Thank You Stickers Nepal
      </Link>
      <div className="nav-links">
        <Link to="/products">Shop</Link>

        {user && user.username ? (
          <>
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {user.username} ▼
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  {user.role === 'admin' && (
                    <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                    Account Settings
                  </Link>
                  <button onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
            <CartIcon />
          </>
        ) : (
          <>
            <button
              className="get-started-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Get Started
            </button>
            <CartIcon />
          </>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </nav>
  );
};

export default Navbar;
