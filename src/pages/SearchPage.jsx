import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchPage.css';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allProducts, setAllProducts] = useState([]);

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    console.log('Location:', location);
    console.log('URL Query:', query);
    setSearchQuery(query);
  }, [location]);

  // Sanitize input to prevent XSS
  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '');
  };

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        console.log('Fetching products...');
        const response = await fetch('http://localhost/backend/api/get_products.php');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        console.log('Products data:', data);
        if (data.success) {
          setAllProducts(data.products);
        } else {
          throw new Error(data.error || 'Failed to load products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle search
  useEffect(() => {
    console.log('Search query changed:', searchQuery);
    console.log('All products:', allProducts);
    
    if (searchQuery) {
      const sanitizedQuery = sanitizeInput(searchQuery.toLowerCase());
      console.log('Sanitized query:', sanitizedQuery);
      
      const results = allProducts.filter((product) => {
        const productName = product.name.toLowerCase();
        const productDescription = product.description.toLowerCase();
        const matches = productName.includes(sanitizedQuery) ||
                       productDescription.includes(sanitizedQuery);
        console.log(`Product "${product.name}" matches:`, matches);
        return matches;
      });
      
      console.log('Filtered results:', results);
      setFilteredResults(results);
    } else {
      setFilteredResults([]);
    }
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const query = formData.get('search').trim();
    console.log('Form search query:', query);
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="search-page">

      <div className="search-results">
        {searchQuery && <h2>Search Results for: "{sanitizeInput(searchQuery)}"</h2>}
        
        {filteredResults.length > 0 ? (
          <div className="product-grid">
            {filteredResults.map((product) => (
              <div key={product.id} className="product-card">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="product-image"
                />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <p className="no-results">No products found matching your search.</p>
        ) : (
          <p className="no-results">Enter a search term to find products.</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage; 