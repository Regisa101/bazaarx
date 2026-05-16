import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/buyer" className="footer-logo">Bazaar<span>X</span></Link>
            <p className="footer-tagline">Nepal's marketplace for independent sellers. Find handcrafted, unique goods from local artisans.</p>
            <div className="footer-socials">
              <a href="#" className="social-btn" title="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" className="social-btn" title="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" className="social-btn" title="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Shop</h4>
            <ul className="footer-links">
              <li><Link to="/buyer">All Products</Link></li>
              <li><Link to="/buyer">Flash Sale</Link></li>
              <li><Link to="/buyer">New Arrivals</Link></li>
              <li><Link to="/buyer">Accessories</Link></li>
              <li><Link to="/buyer">Home & Living</Link></li>
              <li><Link to="/buyer">Clothing</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Sell on BazaarX</h4>
            <ul className="footer-links">
              <li><Link to="/seller">Become a Seller</Link></li>
              <li><Link to="/seller">Seller Dashboard</Link></li>
              <li><Link to="/seller/add">Add a Product</Link></li>
              <li><a href="#">Seller Guidelines</a></li>
              <li><a href="#">Commission Rates</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Help & Support</h4>
            <ul className="footer-links">
              <li><a href="#">Track Your Order</a></li>
              <li><a href="#">Returns & Refunds</a></li>
              <li><a href="#">Shipping Info</a></li>
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Contact</h4>
            <ul className="footer-contact">
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                Thamel, Kathmandu, Nepal
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                +977-1-4XXXXXX
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                support@bazaarx.com.np
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p className="footer-copy">© 2025 BazaarX. </p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
          <div className="footer-payment">
            <span className="payment-badge">eSewa</span>
            <span className="payment-badge">Khalti</span>
            <span className="payment-badge">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}