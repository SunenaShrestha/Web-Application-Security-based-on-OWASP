import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage('');

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost/backend/api/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (data.success) {
        setMessage('Profile updated successfully!');
        // Clear password fields
        setProfileData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profile Settings
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''} 
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="profile-content">
        {message && <div className="message">{message}</div>}

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="profile-form">
            <h2>Profile Settings</h2>
            
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                required
              />
            </div>

            <h3>Change Password</h3>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                value={profileData.currentPassword}
                onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={profileData.newPassword}
                onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
              />
            </div>

            <button type="submit" className="save-btn">Save Changes</button>
          </form>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>Order History</h2>
            {/* Add order history table here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile; 