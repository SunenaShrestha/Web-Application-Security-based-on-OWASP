import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import './AuthModal.css';
import './PasswordStrength.css';

const PasswordValidation = ({ password }) => {
  const requirements = [
    {
      text: "Minimum 8 characters",
      test: () => password.length >= 8
    },
    {
      text: "At least one uppercase letter",
      test: () => /[A-Z]/.test(password)
    },
    {
      text: "At least one number",
      test: () => /[0-9]/.test(password)
    },
    {
      text: "At least one special character (@#$%^&*)",
      test: () => /[@#$%^&*]/.test(password)
    }
  ];

  return (
    <div className="password-requirements">
      {requirements.map((req, index) => (
        <div key={index} className={`requirement ${req.test() ? 'valid' : 'invalid'}`}>
          <span className="requirement-icon">
            {req.test() ? '✓' : '✕'}
          </span>
          <span className="requirement-text">{req.text}</span>
        </div>
      ))}
    </div>
  );
};

const AuthModal = ({ isOpen, onClose }) => {
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [error, setError] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const validatePassword = (password) => {
    const requirements = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[@#$%^&*]/.test(password)
    ];
    return requirements.every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        if (!validatePassword(formData.password)) {
          setError('Password does not meet requirements');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
      }

      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`http://localhost/backend/api/${endpoint}.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success) {
        if (isLogin) {
          setUser(data.user);
          onClose();
        } else {
          setRegistrationSuccess(true);
          setMessage(data.message || 'Registration successful! Please login with your credentials.');
        }
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (registrationSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="auth-modal success-modal">
          <h2>Registration Successful! 🎉</h2>
          <p>{message}</p>
          <button 
            className="submit-btn"
            onClick={() => {
              setRegistrationSuccess(false);
              setIsLogin(true);
              setFormData({
                email: formData.email,
                password: '',
                confirmPassword: '',
                username: ''
              });
            }}
          >
            Back to Login
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-modal">
        <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => !isLogin && setShowPasswordRequirements(true)}
              required
            />
            {!isLogin && showPasswordRequirements && (
              <PasswordValidation password={formData.password} />
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-links">
          <button 
            className="link-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                username: ''
              });
            }}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal; 