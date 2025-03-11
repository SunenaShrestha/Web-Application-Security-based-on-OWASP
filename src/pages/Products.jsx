import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const filterStyle = searchParams.get('style') || 'all';

  useEffect(() => {
    fetchProducts();
  }, []);

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
        setError(data.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const setFilter = (style) => {
    if (style === 'all') {
      navigate('/products');
    } else {
      navigate(`/products?style=${style}`);
    }
  };

  const filteredProducts = filterStyle === 'all' 
    ? products 
    : products.filter(product => product.style.toLowerCase() === filterStyle);

  if (loading) return (
    <div className="loading-container">
      <div className="loader"></div>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p>Error: {error}</p>
    </div>
  );

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Our Collection</h1>
        <div className="filter-buttons">
          <button 
            className={filterStyle === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filterStyle === 'matte' ? 'active' : ''} 
            onClick={() => setFilter('matte')}
          >
            Matte
          </button>
          <button 
            className={filterStyle === 'glossy' ? 'active' : ''} 
            onClick={() => setFilter('glossy')}
          >
            Glossy
          </button>
          <button 
            className={filterStyle === 'holographic' ? 'active' : ''} 
            onClick={() => setFilter('holographic')}
          >
            Holographic
          </button>
        </div>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <Link to={`/product/${product.id}`} className="product-link">
              <div className="product-image">
                <img 
                  src={`http://localhost/backend/${product.image_url}`} 
                  alt={product.name} 
                />
              </div>
              <div className="product-details">
                <h3>{product.name}</h3>
                <div className="price-section">
                  <span className="current-price">NPR {product.price}</span>
                  <span className="original-price">NPR {(product.price * 1.25).toFixed(2)}</span>
                  <span className="discount">5% off</span>
                </div>
                <p className="sale-info">Best touch up to thank your customers.</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products; 