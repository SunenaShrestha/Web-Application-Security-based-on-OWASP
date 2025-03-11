import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationOverlay.css';

const NotificationOverlay = ({ message, onClose }) => {
  const navigate = useNavigate();

  const handleContinueShopping = () => {
    onClose();
  };

  const handleGoToCart = () => {
    navigate('/cart');
    onClose();
  };

  return (
    <div className="notification-overlay">
      <div className="notification-content">
        <div className="success-icon">✓</div>
        <h3>{message}</h3>
        <div className="notification-actions">
          <button onClick={handleContinueShopping} className="continue-btn">
            Continue Shopping
          </button>
          <button onClick={handleGoToCart} className="cart-btn">
            Go to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationOverlay; 