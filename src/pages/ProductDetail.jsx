import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import NotificationOverlay from '../components/NotificationOverlay';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const response = await fetch(`http://localhost/backend/api/get_product.php?id=${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to fetch product details');
        }

        const data = await response.json();
        if (data.success) {
          setProduct(data.product);
          setSelectedImage(0); // Reset selected image when product changes
        } else {
          throw new Error(data.error || 'Failed to fetch product details');
        }
      } catch (error) {
        setError(error.message);
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleQuantityChange = (increment) => {
    setQuantity(prev => {
      const newQuantity = prev + increment;
      return newQuantity > 0 ? newQuantity : 1;
    });
  };

  const handleAddToCart = async () => {
    try {
      const response = await fetch('http://localhost/backend/api/add_to_cart.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: quantity
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowNotification(true);
      } else {
        throw new Error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          {error}
          <button onClick={() => navigate('/products')}>Back to Products</button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="error-message">
          Product not found
          <button onClick={() => navigate('/products')}>Back to Products</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="product-detail-container">
        <div className="product-detail">
          <div className="product-images">
            <div className="main-image">
              <img 
                src={product.images[selectedImage]?.image_url || product.image_url} 
                alt={product.name} 
              />
            </div>
            <div className="thumbnail-images">
              {product.images?.map((image, index) => (
                <div 
                  key={image.id} 
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={image.image_url} alt={`${product.name} view ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="product-info">
            <h1>{product.name}</h1>
            <p className="description">{product.description}</p>
            <div className="details">
              <p><strong>Dimensions:</strong> {product.dimensions}</p>
              <p><strong>Style:</strong> {product.style}</p>
              <p className="price"><strong>Price:</strong> ${product.price}</p>
            </div>
            <div className="quantity-control">
              <button onClick={() => handleQuantityChange(-1)}>-</button>
              <span>{quantity}</span>
              <button onClick={() => handleQuantityChange(1)}>+</button>
            </div>
            <div className="actions">
              <button className="add-to-cart" onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="back" onClick={() => navigate('/products')}>
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNotification && (
        <NotificationOverlay
          message="Product added to cart successfully!"
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
};

export default ProductDetail; 