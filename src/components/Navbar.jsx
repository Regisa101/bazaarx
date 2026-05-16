import { Link, useLocation } from "react-router-dom";
import { useCart } from "../modules/cart/hooks/useCart";
import { useAuth } from "../modules/auth/hooks/useAuth";
import "./Navbar.css";

export default function Navbar({ searchBar }) {
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@700;800&family=Poppins:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <nav className="navbar">
        <div className="navbar-inner">

          <Link to="/buyer" className="navbar-logo">
            Bazaar<span className="logo-x">X</span>
          </Link>

          {searchBar && (
            <div className="navbar-search-slot">{searchBar}</div>
          )}

          <div className={`navbar-right ${searchBar ? "navbar-right--compact" : ""}`}>
            {user ? (
              <div className="nav-user">
                <div className="nav-user-info">
                  <div className="nav-user-avatar">{user.name.charAt(0)}</div>
                  <span className="nav-user-name">{user.name.split(" ")[0]}</span>
                </div>
                {user.role === "admin" && (
                  <Link to="/admin" className="nav-role-chip nav-role-chip--admin">Admin</Link>
                )}
                {user.role === "seller" && (
                  <Link to="/seller" className="nav-role-chip nav-role-chip--seller">My Shop</Link>
                )}
                {user.role === "buyer" && (
                  <Link to="/buyer/orders" className="nav-role-chip nav-role-chip--buyer">Orders</Link>
                )}
                <button onClick={logout} className="nav-logout-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </button>
              </div>
            ) : (
              <div className="nav-auth">
                <Link to="/login" className="nav-text-link">Login</Link>
                <Link to="/signup" className="nav-text-link signup">Signup</Link>
              </div>
            )}

            <div className="nav-icons">
              <Link
                to="/buyer"
                className={`icon-link ${location.pathname === "/buyer" ? "active" : ""}`}
                title="Home"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </Link>
              <Link
                to="/buyer/cart"
                className={`icon-link cart-icon-wrap ${location.pathname === "/buyer/cart" ? "active" : ""}`}
                title="Cart"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>

        </div>
      </nav>
    </>
  );
}