import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductForm from '../components/ProductForm';
import './Admin.css';

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
  const [banners, setBanners] = useState([]);
  const [bannerData, setBannerData] = useState({
    title: '',
    image: null,
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

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

  const handleBannerSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('title', bannerData.title);
      formData.append('image', bannerData.image);

      const response = await fetch('http://localhost/backend/api/add_banner.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setBannerData({ title: '', image: null });
        fetchBanners();
        setMessage('Banner added successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/get_banners.php');
      const data = await response.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;

    try {
      const response = await fetch('http://localhost/backend/api/delete_banner.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: id })
      });

      const data = await response.json();
      if (data.success) {
        fetchBanners();
        setMessage('Banner deleted successfully!');
      } else {
        throw new Error(data.error || 'Failed to delete banner');
      }
    } catch (error) {
      console.error('Delete error:', error);
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

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    setBannerData(prev => ({
      ...prev,
      image: file
    }));
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

  useEffect(() => {
    if (activeTab === 'banners') {
      fetchBanners();
    }
    if (activeTab === 'inventory') {
      fetchProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="brand">
          <h2>Admin Panel</h2>
        </div>
        <nav className="nav-menu">
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </Link>
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
          <Link 
            to="#" 
            className={`nav-item ${activeTab === 'banners' ? 'active' : ''}`}
            onClick={() => setActiveTab('banners')}
          >
            🖼️ Banners
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

          {activeTab === 'banners' && (
            <div className="banner-management">
              <form onSubmit={handleBannerSubmit} className="admin-form">
                <div className="form-group">
                  <label>Banner Title</label>
                  <input
                    type="text"
                    value={bannerData.title}
                    onChange={(e) => setBannerData(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                  />
                </div>
                <div className="form-group">
                  <label>Banner Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    required
                  />
                </div>
                <button type="submit" className="submit-button">
                  Add Banner
                </button>
              </form>

              <div className="banner-list">
                {banners.map(banner => (
                  <div key={banner.id} className="banner-item">
                    <img 
                      src={`http://localhost/backend/${banner.image_url}`} 
                      alt={banner.title} 
                    />
                    <div className="banner-info">
                      <p>{banner.title}</p>
                      <button 
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample order data */}
                  <tr>
                    <td>#192541</td>
                    <td>John Doe</td>
                    <td>Thank You Sticker Pack</td>
                    <td>NPR 1,500.00</td>
                    <td><span className="status-paid">Paid</span></td>
                    <td>2024-01-18</td>
                    <td>
                      <button className="action-btn">⋮</button>
                    </td>
                  </tr>
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
        </div>
      </main>
    </div>
  );
};

export default Admin; 