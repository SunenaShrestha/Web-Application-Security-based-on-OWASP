import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import './Admin.css';
import LogDetail from './LogDetail';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem} from '@radix-ui/react-dropdown-menu';


const Admin = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    dimensions: '',
    price: '',
    style: '',
    image: null,
  });
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState([]);
  const [showBruteForceAlert, setShowBruteForceAlert] = useState(false);
  const [isLogDetailOpen, setLogDetailOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [hasDismissedAlert, setHasDismissedAlert] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      Object.keys(productData).forEach(key => {
        if (key === 'price') {
          formData.append(key, parseFloat(productData[key]).toFixed(2));
        } else {
          formData.append(key, productData[key]);
        }
      });

      const response = await fetch('http://localhost/backend/api/add_product.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Product added successfully!');
        setProductData({
          name: '',
          description: '',
          dimensions: '',
          price: '',
          style: '',
          image: null,
        });
        document.querySelector('input[type="file"]').value = '';
      } else {
        throw new Error(data.error || 'Failed to add product');
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };



  const handleProductChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setProductData(prev => ({
        ...prev,
        image: files[0]
      }));
    } else {
      setProductData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };



  const fetchProducts = async () => {
    try {
        const response = await fetch('http://localhost/backend/api/get_products.php');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Server response:', text);
            throw new Error('Invalid JSON response from server');
        }

        if (data.success) {
            setProducts(data.products);
        } else {
            throw new Error(data.error || 'Failed to fetch products');
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        setMessage('Error: ' + error.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
        const response = await fetch('http://localhost/backend/api/delete_product.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        console.log('Server response:', text); // Debug log

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Failed to parse JSON:', text);
            throw new Error('Invalid JSON response from server');
        }

        if (data.success) {
            fetchProducts();
            setMessage('Product deleted successfully!');
        } else {
            throw new Error(data.error || 'Failed to delete product');
        }
    } catch (error) {
        console.error('Delete error:', error);
        setMessage('Error: ' + error.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Add all fields to formData
      formData.append('id', editingProduct.id);
      formData.append('name', editingProduct.name);
      formData.append('description', editingProduct.description);
      formData.append('dimensions', editingProduct.dimensions);
      formData.append('price', parseFloat(editingProduct.price).toFixed(2));
      formData.append('style', editingProduct.style);
      
      // Only append image if a new one was selected
      if (editingProduct.image instanceof File) {
        formData.append('image', editingProduct.image);
      }

      console.log('Updating product:', Object.fromEntries(formData));

      const response = await fetch('http://localhost/backend/api/update_product.php', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Server response:', text);
        throw new Error('Invalid JSON response from server');
      }

      if (data.success) {
        setEditingProduct(null);
        fetchProducts();
        setMessage('Product updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const handleProductAdded = (data) => {
    setMessage('Product added successfully!');
    setShowAddProduct(false);
    // You can add additional logic here, like refreshing the product list
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_orders.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders);
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_order_items.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setOrderItems(data.orderItems);
      } else {
        throw new Error(data.error || 'Failed to fetch order items');
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
      setMessage('Error: ' + error.message);
    }
  };

  const fetchLoginAttempts = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_logs.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLoginAttempts(data.attempts);
        
        // Check for brute force attempts
        if (data.brute_force_alert) {
          setShowBruteForceAlert(true);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch login attempts');
      }
    } catch (error) {
      console.error('Error fetching login attempts:', error);
      setMessage('Error: ' + error.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchProducts();
    }
    if (activeTab === 'orders') {
      fetchOrders();
      fetchOrderItems();
    }
    if (activeTab === 'dashboard') {
      fetchLoginAttempts();
    }
  }, [activeTab]);

  
  // Initial fetch for brute force detection
  useEffect(() => {
    fetchLoginAttempts();
    // Fetch login attempts every 30 seconds to update brute force detection
    const interval = setInterval(fetchLoginAttempts,30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissAlert = () => {
    setShowBruteForceAlert(false);
    setHasDismissedAlert(true); // Prevent future alerts until page reload
  };

  const handleViewLogs = (logId) => {
    setSelectedLogId(logId);
    setLogDetailOpen(true);
  };

  return (
    <div className="admin-layout">
      {showBruteForceAlert && (
        <div className="brute-force-overlay">
          <div className="brute-force-alert">
            <h2>⚠️ Security Alert</h2>
            <p>Multiple failed login attempts detected. Possible brute force attack in progress.</p>
            <button onClick={handleDismissAlert}>Dismiss</button>
          </div>
        </div>
      )}
      
      <aside className="sidebar">
        <div className="brand">
          <h2>Admin Panel</h2>
          {loginAttempts.length > 0 && (
            <div className="notification-icon" onClick={() => handleViewLogs(loginAttempts[0].id)} title="Latest Failed Login">
              🔔
              <span className="tooltip-text">
                {loginAttempts[0].username} - {new Date(loginAttempts[0].timestamp).toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <nav className="nav-menu">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dropdown-content">
              <DropdownMenuItem asChild>
                <Link to="/site-logs">Attack Logs</Link>
              </DropdownMenuItem>
              {/* Add more items if needed */}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📦 Orders
          </Link>
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📋 Inventory
          </Link>
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            🏷️ Products
          </Link>
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            👥 Customers
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="header-actions">
            <button className="import-btn">⬇️ Import</button>
            <button className="export-btn">⬆️ Export</button>
          </div>
        </header>

        <div className="content-body">
          {activeTab === 'products' && (
            <div className="admin-actions">
              <button 
                className="action-btn"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                {showAddProduct ? 'Cancel' : 'Add Product'}
              </button>
            </div>
          )}

          {showAddProduct && (
            <ProductForm onSuccess={handleProductAdded} />
          )}

          {activeTab === 'orders' && (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Address ID</th>
                    <th>Payment Method</th>
                    <th>Payment Status</th>
                    <th>eSewa Number</th>
                    <th>Total Amount</th>
                    <th>Order Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td><input type="checkbox" /></td>
                      <td>{order.id}</td>
                      <td>{order.user_id}</td>
                      <td>{order.address_id}</td>
                      <td>{order.payment_method}</td>
                      <td>{order.payment_status}</td>
                      <td>{order.esewa_number}</td>
                      <td>{order.total_amount}</td>
                      <td>{order.order_status}</td>
                      <td>{order.created_at}</td>
                      <td>
                        <button className="edit-btn">Edit</button>
                        <button className="copy-btn">Copy</button>
                        <button className="delete-btn">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && orderItems.length > 0 && (
            <div className="order-items-table mt-4">
              <h3>Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Order ID</th>
                    <th>Product ID</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map(item => (
                    <tr key={item.id}>
                      <td><input type="checkbox" /></td>
                      <td>{item.id}</td>
                      <td>{item.order_id}</td>
                      <td>{item.product_id}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price}</td>
                      <td>
                        <button className="edit-btn">Edit</button>
                        <button className="copy-btn">Copy</button>
                        <button className="delete-btn">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="inventory-section">
              <div className="inventory-grid">
                {products.map(product => (
                  <div key={product.id} className="inventory-card">
                    <img 
                      src={`http://localhost/backend/${product.image_url}`} 
                      alt={product.name}
                    />
                    {editingProduct?.id === product.id ? (
                      <form onSubmit={handleEditProduct} className="edit-form">
                        <input type="hidden" value={editingProduct.id} />
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            name: e.target.value
                          })}
                          placeholder="Product Name"
                          required
                        />
                        <textarea
                          value={editingProduct.description}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            description: e.target.value
                          })}
                          placeholder="Description"
                          required
                        />
                        <input
                          type="text"
                          value={editingProduct.dimensions}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            dimensions: e.target.value
                          })}
                          placeholder="Dimensions"
                          required
                        />
                        <input
                          type="number"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            price: e.target.value
                          })}
                          placeholder="Price"
                          step="0.01"
                          required
                        />
                        <select
                          value={editingProduct.style}
                          onChange={(e) => setEditingProduct({
                            ...editingProduct,
                            style: e.target.value
                          })}
                          required
                        >
                          <option value="Matte">Matte</option>
                          <option value="Glossy">Glossy</option>
                          <option value="Holographic">Holographic</option>
                        </select>
                        <div className="form-group">
                          <label>Update Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditingProduct({
                              ...editingProduct,
                              image: e.target.files[0]
                            })}
                          />
                        </div>
                        <div className="edit-actions">
                          <button type="submit" className="save-btn">Save</button>
                          <button 
                            type="button" 
                            onClick={() => setEditingProduct(null)}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="description">{product.description}</p>
                        <p className="specs">
                          <span>{product.dimensions}</span> • 
                          <span>{product.style}</span>
                        </p>
                        <p className="price">NPR {product.price}</p>
                        <div className="card-actions">
                          <button 
                            onClick={() => setEditingProduct(product)}
                            className="edit-btn"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="logs-table">
              <h3>Recent Login Attempts</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>IP Address</th>
                    <th>Email</th>
                    <th>Attempt Time</th>
                    <th>User Agent</th>
                    <th>Status</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {loginAttempts.map(attempt => (
                    <tr key={attempt.id} className={attempt.success === '1' ? 'success-row' : 'failure-row'}>
                      <td>{attempt.id}</td>
                      <td>{attempt.ip_address}</td>
                      <td>{attempt.email}</td>
                      <td>{attempt.attempt_time}</td>
                      <td>{attempt.user_agent}</td>
                      <td>
                        <span className={attempt.success === 1 ? 'status-success' : 'status-failure'}>
                          {attempt.success === 1 ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="viewLogs"
                          onClick={() => handleViewLogs(attempt.id)}
                        >
                          View Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <LogDetail
        isOpen={isLogDetailOpen}
        onClose={() => {
          setLogDetailOpen(false);
          setSelectedLogId(null);
        }}
        logId={selectedLogId}
      />
    </div>
  );
};

export default Admin; 