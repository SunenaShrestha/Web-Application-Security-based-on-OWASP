import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './ProtectedRoute.css';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Show auth modal if user is not authenticated
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  // If user is not authenticated, show auth modal
  if (!user) {
    return (
      <>
        <div className="protected-content-placeholder">
          <p>Please login to access this page</p>
        </div>
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // Check role if specified
  if (role && user.role !== role) {
    return <div className="unauthorized">You are not authorized to access this page.</div>;
  }
  return children;
};

export default ProtectedRoute; 