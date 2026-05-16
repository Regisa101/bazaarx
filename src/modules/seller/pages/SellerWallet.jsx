import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useWallet } from "../../wallet/context/WalletContext";
import { useOrders } from "../../orders/hooks/useOrders";
import "./Seller.css";
import "./SellerWallet.css";

const METHOD_ICONS = {
  esewa:  "🟢",
  khalti: "🟣",
  bank:   "🏦",
  cash:   "💵",
};

const METHOD_LABELS = {
  esewa:  "eSewa",
  khalti: "Khalti",
  bank:   "Bank Transfer",
  cash:   "Cash Pickup",
};

const STATUS_STYLES = {
  pending:  { bg: "#fff8e1", color: "#f57f17",  label: "Pending" },
  approved: { bg: "#e8f5e9", color: "#2e7d32",  label: "Approved" },
  rejected: { bg: "#ffebee", color: "#c62828",  label: "Rejected" },
};

export default function SellerWallet() {
  const { user }                    = useAuth();
  const { getWallet, getSellerWithdrawals, requestWithdrawal } = useWallet();
  const { getOrdersBySeller }       = useOrders();

  const wallet      = getWallet(user?.name || "");
  const myOrders    = getOrdersBySeller(user?.name || "");
  const history     = getSellerWithdrawals(user?.name || "");

  const [showForm,  setShowForm]  = useState(false);
  const [amount,    setAmount]    = useState("");
  const [formError, setFormError] = useState("");
  const [success,   setSuccess]   = useState("");

  // Pre-fill payout details from user profile
  const defaultMethod  = user?.payout?.method        || "esewa";
  const defaultAccount = user?.payout?.accountNumber || "";
  const defaultName    = user?.payout?.accountName   || user?.name || "";

  const [method,    setMethod]    = useState(defaultMethod);
  const [account,   setAccount]   = useState(defaultAccount);
  const [accName,   setAccName]   = useState(defaultName);

  // Delivered order revenue (what wallet should eventually reflect)
  const deliveredRevenue = myOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, order) => {
      const myItems = order.items.filter(i => i.seller === user?.name);
      return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0);
    }, 0);
  const expectedNet = Math.round(deliveredRevenue * 0.9);

  const handleRequest = (e) => {
    e.preventDefault();
    setFormError("");
    const amt = parseInt(amount);
    if (!amt || isNaN(amt)) { setFormError("Please enter a valid amount."); return; }
    if (!account.trim())    { setFormError("Please enter your account number."); return; }

    const result = requestWithdrawal(user?.name, amt, method, account.trim(), accName.trim());
    if (!result.ok) { setFormError(result.error); return; }

    setSuccess(`Withdrawal request of Rs. ${amt.toLocaleString()} submitted! Admin will process it shortly.`);
    setShowForm(false);
    setAmount("");
  };

  const pendingReqs = history.filter(h => h.status === "pending");
  const awaitingConfirmation = myOrders.filter(o => o.status === "pending").length;

  return (
    <div className="seller-page">

      {/* ── Topbar ── */}
      <div className="seller-topbar">
        <div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">Bazaar<span>X</span></Link>
          <span className="seller-role-badge">Seller Panel</span>
          <div className="seller-topbar-links">
            <Link to="/seller"          className="stl">Dashboard</Link>
            <Link to="/seller/products" className="stl">My Products</Link>
            <Link to="/seller/add"      className="stl">Add Product</Link>
            <Link to="/seller/orders"   className="stl">
              Orders
              {awaitingConfirmation > 0 && (
                <span className="stl-badge">{awaitingConfirmation}</span>
              )}
            </Link>
            <Link to="/seller/wallet"   className="stl active">Wallet</Link>
            <Link to="/buyer"           className="stl">View Store</Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">

        {/* ── Header ── */}
        <div className="sd-page-header">
          <div>
            <h1 className="sd-title">My Wallet</h1>
            <p className="sd-subtitle">Track your earnings and request payouts</p>
          </div>
          {wallet.available >= 100 && (
            <button
              className="seller-primary-btn"
              onClick={() => { setShowForm(true); setSuccess(""); setFormError(""); }}
            >
              💸 Request Withdrawal
            </button>
          )}
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="sw-success-banner">
            ✅ {success}
          </div>
        )}

        {/* ── Balance cards ── */}
        <div className="sw-balance-grid">
          <div className="sw-balance-card sw-balance-card--available">
            <p className="sw-balance-label">Available to Withdraw</p>
            <p className="sw-balance-value">Rs. {wallet.available.toLocaleString()}</p>
            <p className="sw-balance-sub">Ready for payout</p>
          </div>
          <div className="sw-balance-card sw-balance-card--earned">
            <p className="sw-balance-label">Total Earned (after 10% fee)</p>
            <p className="sw-balance-value">Rs. {wallet.totalEarned.toLocaleString()}</p>
            <p className="sw-balance-sub">Lifetime net earnings</p>
          </div>
          <div className="sw-balance-card sw-balance-card--commission">
            <p className="sw-balance-label">Platform Commission Paid</p>
            <p className="sw-balance-value">Rs. {wallet.totalCommission.toLocaleString()}</p>
            <p className="sw-balance-sub">10% of your sales</p>
          </div>
          <div className="sw-balance-card sw-balance-card--withdrawn">
            <p className="sw-balance-label">Total Withdrawn</p>
            <p className="sw-balance-value">Rs. {(wallet.withdrawn || 0).toLocaleString()}</p>
            <p className="sw-balance-sub">
              {(wallet.pending || 0) > 0
                ? `Rs. ${wallet.pending.toLocaleString()} pending approval`
                : "No pending requests"}
            </p>
          </div>
        </div>

        {/* ── Info box: wallet vs delivered orders ── */}
        {deliveredRevenue > 0 && wallet.totalEarned === 0 && (
          <div className="sw-info-box">
            <span>ℹ️</span>
            <p>
              You have <strong>Rs. {expectedNet.toLocaleString()}</strong> in delivered order earnings.
              Your wallet will be credited once orders are marked delivered and synced.
              Make sure your orders page is up to date.
            </p>
          </div>
        )}

        {/* ── Payout method on file ── */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">Payout Method on File</h3>
            <Link to="/seller/settings" className="sd-card-link">Change →</Link>
          </div>
          {user?.payout ? (
            <div className="sw-payout-info">
              <span className="sw-payout-icon">
                {METHOD_ICONS[user.payout.method] || "💳"}
              </span>
              <div>
                <p className="sw-payout-method">{METHOD_LABELS[user.payout.method] || user.payout.method}</p>
                <p className="sw-payout-account">{user.payout.accountNumber}</p>
                {user.payout.accountName && (
                  <p className="sw-payout-name">{user.payout.accountName}</p>
                )}
              </div>
              <span className="sw-payout-badge">Default</span>
            </div>
          ) : (
            <p className="sd-empty-text">No payout method set up yet. Go to Settings to add one.</p>
          )}
        </div>

        {/* ── Withdrawal request form ── */}
        {showForm && (
          <div className="sw-card sw-card--form">
            <div className="sw-card-header">
              <h3 className="sw-card-title">Request Withdrawal</h3>
              <button className="sw-close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div className="sw-available-hint">
              Available balance: <strong>Rs. {wallet.available.toLocaleString()}</strong>
              {pendingReqs.length > 0 && (
                <span className="sw-pending-hint">
                  · Rs. {(wallet.pending || 0).toLocaleString()} already pending
                </span>
              )}
            </div>

            <form onSubmit={handleRequest} className="sw-form">
              <div className="sw-form-grid">
                <div className="adm-field">
                  <label>Amount (Rs.) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={`Min Rs. 100 · Max Rs. ${wallet.available.toLocaleString()}`}
                    min="100"
                    max={wallet.available}
                    required
                  />
                </div>
                <div className="adm-field">
                  <label>Payout Method *</label>
                  <select value={method} onChange={e => setMethod(e.target.value)}>
                    <option value="esewa">🟢 eSewa</option>
                    <option value="khalti">🟣 Khalti</option>
                    <option value="bank">🏦 Bank Transfer</option>
                    <option value="cash">💵 Cash Pickup</option>
                  </select>
                </div>
                <div className="adm-field">
                  <label>Account Number / ID *</label>
                  <input
                    type="text"
                    value={account}
                    onChange={e => setAccount(e.target.value)}
                    placeholder="e.g. 9800000000"
                    required
                  />
                </div>
                <div className="adm-field">
                  <label>Account Name *</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={e => setAccName(e.target.value)}
                    placeholder="Full name on account"
                    required
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="sw-quick-amounts">
                {[500, 1000, 2000, 5000].filter(n => n <= wallet.available).map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`sw-quick-amt ${parseInt(amount) === n ? "active" : ""}`}
                    onClick={() => setAmount(String(n))}
                  >
                    Rs. {n.toLocaleString()}
                  </button>
                ))}
                {wallet.available >= 100 && (
                  <button
                    type="button"
                    className={`sw-quick-amt ${parseInt(amount) === wallet.available ? "active" : ""}`}
                    onClick={() => setAmount(String(wallet.available))}
                  >
                    All (Rs. {wallet.available.toLocaleString()})
                  </button>
                )}
              </div>

              {formError && <p className="sw-form-error">⚠ {formError}</p>}

              <div className="sw-form-footer">
                <button type="button" className="form-cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="seller-primary-btn">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Withdrawal history ── */}
        <div className="sw-card">
          <div className="sw-card-header">
            <h3 className="sw-card-title">Withdrawal History</h3>
            <span className="sd-card-link">{history.length} requests</span>
          </div>

          {history.length === 0 ? (
            <div className="sw-empty">
              <span style={{ fontSize: "2.5rem" }}>💰</span>
              <p>No withdrawal requests yet.</p>
              {wallet.available >= 100
                ? <button className="seller-primary-btn" onClick={() => setShowForm(true)}>Make your first withdrawal</button>
                : <p style={{ fontSize: "0.8rem", color: "#bbb" }}>Earn Rs. 100+ to unlock withdrawals.</p>
              }
            </div>
          ) : (
            <div className="sw-history-list">
              {history.map(req => {
                const style = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
                return (
                  <div key={req.id} className="sw-history-row">
                    <div className="sw-history-left">
                      <span className="sw-history-icon">
                        {METHOD_ICONS[req.method] || "💳"}
                      </span>
                      <div>
                        <p className="sw-history-id">{req.id}</p>
                        <p className="sw-history-meta">
                          {METHOD_LABELS[req.method]} · {req.accountNumber}
                        </p>
                        <p className="sw-history-date">
                          Requested {new Date(req.requestedAt).toLocaleDateString("en-NP", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {req.processedAt && (
                            <> · Processed {new Date(req.processedAt).toLocaleDateString("en-NP", {
                              day: "numeric", month: "short", year: "numeric",
                            })}</>
                          )}
                        </p>
                        {req.adminNote && (
                          <p className="sw-history-note">Admin note: "{req.adminNote}"</p>
                        )}
                      </div>
                    </div>
                    <div className="sw-history-right">
                      <p className="sw-history-amount">Rs. {req.amount.toLocaleString()}</p>
                      <span
                        className="sw-history-status"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {style.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}