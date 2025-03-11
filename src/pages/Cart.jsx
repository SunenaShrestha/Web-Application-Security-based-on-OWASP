import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Cart.css';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { updateCartCount } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_cart.php', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setCartItems(data.items);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.log('Your cart is empty!! Try adding products into cart!!');
      console.error('Cart fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const response = await fetch('http://localhost/backend/api/update_cart.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          quantity: newQuantity
        })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCartItems();
        updateCartCount(); // Update cart count after quantity change
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Update quantity error:', error);
    }
  };

  const removeItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;

    try {
      const response = await fetch('http://localhost/backend/api/remove_cart_item.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ item_id: itemId })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCartItems();
        updateCartCount(); // Update cart count after removing item
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Remove item error:', error);
    }
  };

  if (loading) return <div className="cart-loading">Loading...</div>;
  if (error) return <div className="cart-error">{error}</div>;
  if (cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart and they will show up here</p>
        <Link to="/products" className="continue-shopping">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id} className="cart-item">
            <div className="item-image">
              <img src={item.image_url} alt={item.name} />
            </div>
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="item-price">${item.price}</p>
              <div className="item-style">Style: {item.style}</div>
            </div>
            <div className="item-quantity">
              <button 
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <div className="item-total">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            <button 
              className="remove-item"
              onClick={() => removeItem(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="cart-actions">
        <div className="cart-total">
          <span>Total:</span>
          <span>Rs. {total.toFixed(2)}</span>
        </div>
        <button 
          className="checkout-btn"
          onClick={() => navigate('/checkout')}
          disabled={cartItems.length === 0}
        >
          Proceed to Checkout
        </button>
      </div>
      <Link to="/products" className="continue-shopping">
        Continue Shopping
      </Link>
    </div>
  );
};

export default Cart; 