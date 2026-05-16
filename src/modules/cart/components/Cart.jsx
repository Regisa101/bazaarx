import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";
import { useProducts } from "../../products/hooks/useProducts";
import "./Cart.css";

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { products } = useProducts();

  const getStock = (productId) => {
    const product = products.find(p => p.id === productId);
    return product?.stock ?? 0;
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <h1 className="cart-title">Your Cart</h1>
          <div className="cart-empty">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            </div>
            <p className="empty-msg">Your cart is empty.</p>
            <Link to="/buyer" className="btn-shop">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <h1 className="cart-title">Your Cart</h1>
          <button onClick={clearCart} className="btn-clear">Clear all</button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => {
              const maxStock  = getStock(item.id);
              const atMax     = item.quantity >= maxStock;
              const stockLeft = maxStock - item.quantity;

              return (
                <div key={item.cartId} className="cart-item">
                  <img src={item.image} alt={item.name} className="item-image" />

                  <div className="item-info">
                    <p className="item-seller">{item.seller}</p>
                    <p className="item-name">{item.name}</p>
                    {/* Show variant label if present */}
                    {item.variantLabel && (
                      <p className="item-variant">{item.variantLabel}</p>
                    )}
                    <p className="item-price-unit">Rs. {item.price.toLocaleString()} each</p>
                    {maxStock <= 10 && !atMax && (
                      <p className="item-stock-warn">Only {stockLeft} more available</p>
                    )}
                    {atMax && (
                      <p className="item-stock-warn item-stock-warn--max">
                        Max available ({maxStock})
                      </p>
                    )}
                  </div>

                  <div className="item-controls">
                    <div className="qty-control">
                      <button className="qty-btn"
                        onClick={() => updateQuantity(item.cartId, item.quantity - 1, maxStock)}
                        disabled={item.quantity <= 1}>−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className={`qty-btn ${atMax ? "qty-btn--disabled" : ""}`}
                        onClick={() => { if (!atMax) updateQuantity(item.cartId, item.quantity + 1, maxStock); }}
                        disabled={atMax}
                        title={atMax ? `Only ${maxStock} in stock` : ""}>+</button>
                    </div>

                    <p className="item-subtotal">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>

                    <button className="item-remove" onClick={() => removeFromCart(item.cartId)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span className="summary-free">{cartTotal >= 2000 ? "Free" : "Rs. 100"}</span>
              </div>
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>Rs. {(cartTotal + (cartTotal >= 2000 ? 0 : 100)).toLocaleString()}</span>
              </div>
            </div>
            <Link to="/buyer/checkout" className="btn-checkout"
              style={{ textAlign:"center", display:"block", textDecoration:"none" }}>
              Proceed to Checkout
            </Link>
            <Link to="/buyer" className="btn-continue">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}