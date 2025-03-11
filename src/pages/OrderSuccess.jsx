import { useLocation, Link } from 'react-router-dom';

const OrderSuccess = () => {
    const location = useLocation();
    const { orderId, message } = location.state || {};

    return (
        <div className="order-success">
            <h1>Order Placed Successfully!</h1>
            <p>Your order #{orderId} has been placed.</p>
            <p>{message}</p>
            <Link to="/products" className="continue-shopping">
                Continue Shopping
            </Link>
        </div>
    );
};

export default OrderSuccess; 