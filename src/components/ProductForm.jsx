import { useState } from 'react';
import './ProductForm.css';

const ProductForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dimensions: '',
    price: '',
    style: '',
    image: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({
        ...prev,
        image: files[0]
      }));
    } else if (name === 'price') {
      // Ensure price is a valid number with 2 decimal places
      const formattedPrice = parseFloat(value).toFixed(2);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPrice
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Validate and format data before sending
      if (!formData.name.trim()) throw new Error('Product name is required');
      if (!formData.description.trim()) throw new Error('Description is required');
      if (!formData.dimensions.trim()) throw new Error('Dimensions are required');
      if (!formData.price || isNaN(formData.price)) throw new Error('Valid price is required');
      if (!formData.style) throw new Error('Style is required');
      if (!formData.image) throw new Error('Product image is required');

      // Append all form data
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('dimensions', formData.dimensions.trim());
      formDataToSend.append('price', parseFloat(formData.price).toFixed(2));
      formDataToSend.append('style', formData.style);
      formDataToSend.append('image', formData.image);

      console.log('Sending form data:', Object.fromEntries(formDataToSend));

      const response = await fetch('http://localhost/backend/api/add_product.php', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      const data = await response.json();
      console.log('Add product response:', data);

      if (data.success) {
        setFormData({
          name: '',
          description: '',
          dimensions: '',
          price: '',
          style: '',
          image: null
        });
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        throw new Error(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Add product error:', error);
      setError(error.message || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-container">
      <h2>Add New Product</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Product Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Dimensions</label>
          <input
            type="text"
            name="dimensions"
            value={formData.dimensions}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Style</label>
          <select 
            name="style" 
            value={formData.style} 
            onChange={handleChange} 
            required
          >
            <option value="">Select style</option>
            <option value="Matte">Matte</option>
            <option value="Glossy">Glossy</option>
            <option value="Holographic">Holographic</option>
          </select>
        </div>

        <div className="form-group">
          <label>Product Image</label>
          <input
            type="file"
            name="image"
            onChange={handleChange}
            accept="image/*"
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm; 