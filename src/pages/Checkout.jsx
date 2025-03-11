import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const Checkout = () => {
  const { user, updateCartCount } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [esewaNumber, setEsewaNumber] = useState('');
  const [esewaOTP, setEsewaOTP] = useState('');
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpError, setOtpError] = useState('');

  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    province: '',
    landmark: ''
  });

  useEffect(() => {
    fetchAddresses();
    fetchCartTotal();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_addresses.php', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchCartTotal = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_cart.php', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setCartTotal(total);
      }
    } catch (error) {
      console.error('Error fetching cart total:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost/backend/api/add_address.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();
      
      if (data.success) {
        fetchAddresses();
        setShowAddAddress(false);
        setNewAddress({
          fullName: '',
          phone: '',
          street: '',
          city: '',
          province: '',
          landmark: ''
        });
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleRequestOTP = async () => {
    if (!esewaNumber) {
      alert('Please enter your eSewa number');
      return;
    }

    try {
      const response = await fetch('http://localhost/backend/api/request_esewa_otp.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ esewaNumber })
      });

      const data = await response.json();
      
      if (data.success) {
        setOtpRequested(true);
        alert(`OTP sent successfully! (Demo OTP: ${data.demo_otp})`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      setOtpError(error.message);
    }
  };

  const handlePayment = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (paymentMethod === 'esewa' && (!esewaNumber || !esewaOTP)) {
      alert('Please enter eSewa details and verify OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost/backend/api/create_order.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          addressId: selectedAddress,
          paymentMethod,
          esewaNumber: paymentMethod === 'esewa' ? esewaNumber : null,
          amount: cartTotal
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Clear cart count
        updateCartCount();
        // Navigate to order confirmation
        navigate('/order-success', { 
          state: { 
            orderId: data.orderId,
            message: data.message 
          } 
        });
      } else {
        throw new Error(data.error || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="checkout-container">
      <button onClick={() => navigate('/cart')} className="back-button">
        ← Back to cart
      </button>

      <div className="checkout-sections">
        <div className="delivery-section">
          <h2>Delivery Address</h2>
          
          {addresses.length > 0 && (
            <div className="saved-addresses">
              {addresses.map(address => (
                <div 
                  key={address.id} 
                  className={`address-card ${selectedAddress === address.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAddress(address.id)}
                >
                  <h3>{address.fullName}</h3>
                  <p>{address.street}</p>
                  <p>{address.city}, {address.province}</p>
                  <p>Phone: {address.phone}</p>
                  {address.landmark && <p>Landmark: {address.landmark}</p>}
                </div>
              ))}
            </div>
          )}

          <button 
            className="add-address-btn"
            onClick={() => setShowAddAddress(true)}
          >
            + Add New Address
          </button>

          {showAddAddress && (
            <div className="add-address-form">
              <h3>Add New Address</h3>
              <form onSubmit={handleAddAddress}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newAddress.fullName}
                  onChange={e => setNewAddress({...newAddress, fullName: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newAddress.phone}
                  onChange={e => setNewAddress({...newAddress, phone: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  value={newAddress.street}
                  onChange={e => setNewAddress({...newAddress, street: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Province"
                  value={newAddress.province}
                  onChange={e => setNewAddress({...newAddress, province: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Landmark (Optional)"
                  value={newAddress.landmark}
                  onChange={e => setNewAddress({...newAddress, landmark: e.target.value})}
                />
                <div className="form-buttons">
                  <button type="submit">Save Address</button>
                  <button type="button" onClick={() => setShowAddAddress(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="payment-section">
          <h2>Payment Method</h2>
          <div className="payment-methods">
            <div
              className={`payment-option ${paymentMethod === 'esewa' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('esewa')}
            >
              <img src="/esewa-logo.png" alt="eSewa" />
              <span>eSewa</span>
            </div>
            <div
              className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('cod')}
            >
              <img src="/cod-icon.png" alt="Cash on Delivery" />
              <span>Cash on Delivery</span>
            </div>
          </div>

          {paymentMethod === 'esewa' && (
            <div className="esewa-details">
              <div className="esewa-number-input">
                <input
                  type="tel"
                  placeholder="eSewa Number"
                  value={esewaNumber}
                  onChange={e => setEsewaNumber(e.target.value)}
                />
                <button 
                  className="request-otp-btn"
                  onClick={handleRequestOTP}
                  disabled={!esewaNumber || otpRequested}
                >
                  Request OTP
                </button>
              </div>
              {otpRequested && (
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={esewaOTP}
                  onChange={e => setEsewaOTP(e.target.value)}
                />
              )}
              {otpError && <div className="error-message">{otpError}</div>}
            </div>
          )}

          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs. {cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>Rs. 0.00</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>Rs. {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            className="place-order-btn"
            onClick={handlePayment}
          >
            Place Order (Rs. {cartTotal.toFixed(2)})
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 