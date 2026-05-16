import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Auth.css";

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const loggedIn = login(email, password);
      setLoading(false);
      if (!loggedIn) return;

      if (loggedIn.role === "admin") {
        navigate("/admin");
      } else if (loggedIn.role === "seller") {
        // New seller → go through setup flow
        if (!loggedIn.storeSetupDone) {
          navigate("/seller/setup/store");
        } else if (!loggedIn.paymentSetupDone) {
          navigate("/seller/setup/payment");
        } else {
          navigate("/seller");
        }
      } else {
        navigate("/buyer");
      }
    }, 600);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/buyer" className="auth-logo">Bazaar<span>X</span></Link>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to your BazaarX account</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Your password"
              value={password} onChange={e => { setPassword(e.target.value); setError(""); }} required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>

        <div className="auth-demo-accounts">
          <p className="auth-demo-title">Demo accounts</p>
          <div className="auth-demo-list">
            {[
              { role: "admin",  email: "admin@bazaarx.com",  password: "admin123" },
              { role: "seller", email: "seller@bazaarx.com", password: "seller123" },
              { role: "buyer",  email: "buyer@bazaarx.com",  password: "buyer123" },
            ].map(a => (
              <button key={a.role} className="auth-demo-item auth-demo-clickable"
                onClick={() => { setEmail(a.email); setPassword(a.password); setError(""); }}>
                <span className={`auth-demo-role ${a.role}`}>{a.role}</span>
                <span>{a.email}</span>
                <span className="auth-demo-click">Click to fill</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}