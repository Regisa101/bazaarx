import { Link, useParams } from "react-router-dom";
import { useOrders } from "../../orders/hooks/useOrders";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "./OrderConfirmation.css";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { orders } = useOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", fontFamily: "Poppins, sans-serif" }}>
        <p>Order not found.</p>
        <Link to="/buyer">← Back to Shop</Link>
      </div>
    );
  }

  const statusMap = {
    cod: "Your order will be confirmed shortly.",
    esewa: "Payment via eSewa confirmed.",
    khalti: "Payment via Khalti confirmed.",
    bank: "Please complete your bank transfer within 24 hours.",
  };

  return (
    <div className="oc-page">
      <Navbar searchBar={null} />

      <div className="oc-container">
        <div className="oc-card">
          <div className="oc-success-icon">✓</div>
          <h1 className="oc-title">Order Placed!</h1>
          <p className="oc-sub">{statusMap[order.paymentMethod]}</p>
          <div className="oc-order-id">Order ID: <strong>{order.id}</strong></div>

          <div className="oc-details">
            <div className="oc-section">
              <h3>Delivering to</h3>
              <p>{order.address.fullName} · {order.address.phone}</p>
              <p>{order.address.area}, {order.address.city}, {order.address.province}</p>
            </div>

            <div className="oc-section">
              <h3>Payment</h3>
              <p>
                {order.paymentMethod === "cod" ? "Cash on Delivery" :
                 order.paymentMethod === "esewa" ? "eSewa" :
                 order.paymentMethod === "khalti" ? "Khalti" : "Bank Transfer"}
              </p>
            </div>

            <div className="oc-section">
              <h3>Items Ordered</h3>
              <div className="oc-items">
                {order.items.map((item) => (
                  <div key={item.id} className="oc-item">
                    <img src={item.image} alt={item.name} className="oc-item-img" />
                    <div className="oc-item-info">
                      <p className="oc-item-name">{item.name}</p>
                      <p className="oc-item-seller">{item.seller} · ×{item.quantity}</p>
                    </div>
                    <p className="oc-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="oc-total">
              <span>Total Paid</span>
              <span>Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="oc-actions">
            <Link to="/buyer/orders" className="oc-btn-orders">View My Orders</Link>
            <Link to="/buyer" className="oc-btn-shop">Continue Shopping →</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}