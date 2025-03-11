import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>Welcome to Thank You Stickers Nepal</h1>
        <p>Discover our collection of thank you stickers and find the top picks for your packaging!</p>
        <Link to="/products" className="shop-now-btn">
          Shop Now
        </Link>
      </div>



      <div className="product-section"></div>
      <div className="image-cards">
        <div className="image-card">
          <img src="/images/image1.jpg" alt="Product 1"/>
        </div>
        <div className="image-card">
          <img src="/images/image2.webp" alt="Product 2"/>
        </div>
        <div className="image-card">
          <img src="/images/image3.jpg" alt="Product 3"/>
        </div>
      </div>
      
      <div className="categories-section">
        <h2>Shop our most popular categories</h2>
        <div className="category-grid">
          <Link to="/products?style=matte" className="category-card">
            <img src="/images/matte-sticker.jpg" alt="Matte Stickers" />
            <h3>Matte</h3>
          </Link>
          <Link to="/products?style=glossy" className="category-card">
            <img src="/images/glossy-sticker.jpg" alt="Glossy Stickers" />
            <h3>Glossy</h3>
          </Link>
          <Link to="/products?style=holographic" className="category-card">
            <img src="/images/holographic-sticker.jpg" alt="Holographic Stickers" />
            <h3>Holographic</h3>
          </Link>
          <Link to="/products" className="category-card">
            <img src="/images/all-stickers.jpg" alt="All Stickers" />
            <h3>All Stickers</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;