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
  const [searchQuery, setSearchQuery] = useState("");

  // Debug logging
  useEffect(() => {
    console.log('Current user in Navbar:', user);
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      console.log('Encoded query:', encodedQuery);
      const searchUrl = `/search?q=${encodedQuery}`;
      console.log('Navigating to:', searchUrl);
      navigate(searchUrl, { replace: true });
    }
  };

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
        <div className="searchBar">
          <form onSubmit={handleSearch} className="searchBar">
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <span className="search-icon"></span>
            </button>
          </form>
        </div>
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
