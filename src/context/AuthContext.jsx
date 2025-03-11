import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  logout: () => {},
  checkAuth: () => {},
  cartCount: 0,
  updateCartCount: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/check_auth.php', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Check auth on mount and set up periodic checks
  useEffect(() => {
    checkAuth();

    // Check session every minute
    const intervalId = setInterval(checkAuth, 60000);

    // Check session on window focus
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Monitor user state changes
  useEffect(() => {
    if (user) {
      // Reset the activity timer whenever there's user interaction
      const resetTimer = () => {
        localStorage.setItem('lastActivity', Date.now().toString());
      };

      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('click', resetTimer);
      window.addEventListener('scroll', resetTimer);

      return () => {
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keypress', resetTimer);
        window.removeEventListener('click', resetTimer);
        window.removeEventListener('scroll', resetTimer);
      };
    }
  }, [user]);

  const logout = async () => {
    try {
      await fetch('http://localhost/backend/api/logout.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Add function to fetch cart count
  const updateCartCount = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_cart.php', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // Check cart count on mount and when user changes
  useEffect(() => {
    if (user) {
      updateCartCount();
    } else {
      setCartCount(0);
    }
  }, [user]);

  const value = {
    user,
    setUser,
    loading,
    logout,
    checkAuth,
    cartCount,
    updateCartCount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 