import { Link } from "react-router-dom";
import { useOrders } from "../../orders/hooks/useOrders";
import { useAuth } from "../../auth/hooks/useAuth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "./OrderHistory.css";

const STATUS_COLORS = {
  confirmed: { bg: "#e8f5e9", color: "#2e7d32" },
  processing: { bg: "#fff8e1", color: "#f57f17" },
  shipped: { bg: "#e3f2fd", color: "#1565c0" },
  delivered: { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled: { bg: "#ffebee", color: "#c62828" },
};

export default function OrderHistory() {
  const { user } = useAuth();
  const { getOrdersByBuyer } = useOrders();
  const myOrders = getOrdersByBuyer(user?.email);

  return (
    <div className="oh-page">
      <Navbar searchBar={null} />

      <div className="oh-container">
        <div className="oh-header">
          <h1 className="oh-title">My Orders</h1>
          <Link to="/buyer" className="oh-back">← Continue Shopping</Link>
        </div>

        {myOrders.length === 0 ? (
          <div className="oh-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <p>No orders yet.</p>
            <Link to="/buyer" className="oh-shop-btn">Start Shopping</Link>
          </div>
        ) : (
          <div className="oh-list">
            {myOrders.map((order) => {
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.confirmed;
              return (
                <div key={order.id} className="oh-card">
                  <div className="oh-card-header">
                    <div>
                      <p className="oh-order-id">{order.id}</p>
                      <p className="oh-date">
                        {new Date(order.placedAt).toLocaleDateString("en-NP", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className="oh-status"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="oh-items">
                    {order.items.map((item) => (
                      <div key={item.id} className="oh-item">
                        <img src={item.image} alt={item.name} className="oh-item-img" />
                        <div className="oh-item-info">
                          <p className="oh-item-name">{item.name}</p>
                          <p className="oh-item-meta">{item.seller} · ×{item.quantity}</p>
                        </div>
                        <p className="oh-item-price">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="oh-card-footer">
                    <div className="oh-address">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {order.address.area}, {order.address.city}
                    </div>
                    <div className="oh-total">
                      Total: <strong>Rs. {order.total.toLocaleString()}</strong>
                      <span className="oh-payment">· {
                        order.paymentMethod === "cod" ? "Cash on Delivery" :
                        order.paymentMethod === "esewa" ? "eSewa" :
                        order.paymentMethod === "khalti" ? "Khalti" : "Bank Transfer"
                      }</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}