import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../../orders/hooks/useOrders";
import { useAuth } from "../../auth/hooks/useAuth";
import { useWallet } from "../../wallet/context/WalletContext"; // ← NEW
import "./Seller.css";
import "./SellerOrders.css";

const STATUS_OPTIONS = ["confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES = {
  confirmed:  { bg: "#e3f2fd", color: "#1565c0" },
  processing: { bg: "#fff8e1", color: "#f57f17" },
  shipped:    { bg: "#e8eaf6", color: "#283593" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled:  { bg: "#ffebee", color: "#c62828" },
};

const PAYMENT_LABELS = {
  cod:   "Cash on Delivery",
  esewa: "eSewa",
  khalti:"Khalti",
  bank:  "Bank Transfer",
};

const AUTO_STEPS = {
  confirmed:  { next: "processing", afterMinutes: 2  },
  processing: { next: "shipped",    afterMinutes: 10 },
  shipped:    { next: "delivered",  afterMinutes: 30 },
};

export default function SellerOrders() {
  const { user }                                   = useAuth();
  const { getOrdersBySeller, updateOrderStatus }   = useOrders();
  const { creditSeller }                           = useWallet(); // ← NEW
  const myOrders                                   = getOrdersBySeller(user?.name || "");

  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");

  // Track which order IDs we've already credited so we don't double-credit
  const creditedRef = useRef(new Set(
    JSON.parse(localStorage.getItem("bazaarx_credited_orders") || "[]")
  ));

  // ── Credit wallet when an order reaches "delivered" ────────────
  const creditIfDelivered = (order, sellerName) => {
    if (order.status !== "delivered") return;
    if (creditedRef.current.has(order.id)) return; // already credited

    const myItems    = order.items.filter(i => i.seller === sellerName);
    const grossTotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
    if (grossTotal === 0) return;

    creditSeller(sellerName, grossTotal);
    creditedRef.current.add(order.id);

    // Persist so it survives page refresh
    localStorage.setItem(
      "bazaarx_credited_orders",
      JSON.stringify([...creditedRef.current])
    );
  };

  // ── Auto-progression ───────────────────────────────────────────
  const ordersRef         = useRef([]);
  const updateStatusRef   = useRef(updateOrderStatus);
  const creditRef         = useRef(creditIfDelivered);
  const userNameRef       = useRef(user?.name);
  ordersRef.current       = myOrders;
  updateStatusRef.current = updateOrderStatus;
  creditRef.current       = creditIfDelivered;
  userNameRef.current     = user?.name;

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      ordersRef.current.forEach((order) => {
        if (order.status === "cancelled" || order.status === "delivered") {
          // Still attempt to credit if delivered (handles manual advances)
          creditRef.current(order, userNameRef.current);
          return;
        }
        const step = AUTO_STEPS[order.status];
        if (!step) return;
        const ageMinutes = (now - new Date(order.placedAt).getTime()) / 60000;
        if (ageMinutes >= step.afterMinutes) {
          updateStatusRef.current(order.id, step.next);
          if (step.next === "delivered") {
            // Will be picked up next tick once state updates
            setTimeout(() => creditRef.current({ ...order, status: "delivered" }, userNameRef.current), 500);
          }
        }
      });
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Also credit any already-delivered orders on mount (handles refreshes)
  useEffect(() => {
    myOrders.forEach(order => {
      if (order.status === "delivered") {
        creditIfDelivered(order, user?.name);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle manual status change ────────────────────────────────
  const handleStatusChange = (order, newStatus) => {
    updateOrderStatus(order.id, newStatus);
    if (newStatus === "delivered") {
      // Give state a tick to propagate, then credit
      setTimeout(() => creditIfDelivered({ ...order, status: "delivered" }, user?.name), 300);
    }
  };

  // ── Derived / filtered list ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...myOrders].sort(
      (a, b) => new Date(b.placedAt) - new Date(a.placedAt)
    );
    if (activeTab !== "all") list = list.filter((o) => o.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.buyer?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [myOrders, activeTab, search]);

  // ── Stats ───────────────────────────────────────────────────────
  const totalRevenue = myOrders.reduce((sum, order) => {
    const myItems = order.items.filter((i) => i.seller === user?.name);
    return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);

  const tabCounts = useMemo(() => {
    const counts = { all: myOrders.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s] = myOrders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [myOrders]);

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
            <Link to="/seller/orders"   className="stl active">Orders</Link>
            <Link to="/seller/wallet"   className="stl">Wallet</Link>
            <Link to="/buyer"           className="stl">View Store</Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">

        {/* ── Header ── */}
        <div className="seller-page-header">
          <div>
            <h1 className="seller-page-title">My Orders</h1>
            <p className="seller-page-sub">
              {myOrders.length} total ·{" "}
              Revenue: <strong>Rs. {totalRevenue.toLocaleString()}</strong>
            </p>
          </div>
          <div className="so-auto-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
            Auto-advancing orders
          </div>
        </div>

        {/* ── Status summary cards ── */}
        <div className="so-status-summary">
          {STATUS_OPTIONS.map((s) => {
            const style = STATUS_STYLES[s];
            return (
              <div key={s} className="so-status-card" style={{ background: style.bg }}>
                <p className="so-status-card-count" style={{ color: style.color }}>
                  {tabCounts[s]}
                </p>
                <p className="so-status-card-label" style={{ color: style.color }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs + search ── */}
        <div className="so-filter-bar">
          <div className="so-tabs">
            {["all", ...STATUS_OPTIONS].map((tab) => (
              <button
                key={tab}
                className={`so-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="so-tab-count">{tabCounts[tab]}</span>
              </button>
            ))}
          </div>
          <div className="so-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="#aaa" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="so-search"
              placeholder="Search by order ID or buyer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Empty state ── */}
        {filtered.length === 0 ? (
          <div className="seller-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="#ddd" strokeWidth="1.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {myOrders.length === 0 ? (
              <>
                <p>No orders yet. Share your products to start selling!</p>
                <Link to="/buyer" className="seller-primary-btn">View Store</Link>
              </>
            ) : (
              <>
                <p>No orders match your filter.</p>
                <button
                  className="form-cancel-btn"
                  onClick={() => { setActiveTab("all"); setSearch(""); }}
                >
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (

          /* ── Order cards ── */
          <div className="so-list">
            {filtered.map((order) => {
              const myItems     = order.items.filter((i) => i.seller === user?.name);
              const myGross     = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
              const myNet       = Math.round(myGross * 0.9);
              const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.confirmed;
              const autoNext    = AUTO_STEPS[order.status];

              return (
                <div key={order.id} className="so-card">

                  {/* ── Order header ── */}
                  <div className="so-header">
                    <div>
                      <p className="so-order-id">{order.id}</p>
                      <p className="so-date">
                        {new Date(order.placedAt).toLocaleDateString("en-NP", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </p>
                      {autoNext && (
                        <p className="so-auto-hint">
                          Auto → {autoNext.next} in ~{autoNext.afterMinutes} min
                        </p>
                      )}
                    </div>

                    <div className="so-status-control">
                      <span
                        className="so-status-badge"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>

                      {/* ← updated: calls handleStatusChange instead of updateOrderStatus directly */}
                      <select
                        className="so-status-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s === order.status
                              ? `✓ ${s.charAt(0).toUpperCase() + s.slice(1)} (current)`
                              : `→ ${s.charAt(0).toUpperCase() + s.slice(1)}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── Buyer info ── */}
                  <div className="so-buyer-info">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <strong>{order.buyer?.name}</strong>
                    <span>·</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>
                      {order.address?.area}, {order.address?.city},{" "}
                      {order.address?.province}
                    </span>
                    <span className="so-payment-chip">
                      {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                    </span>
                  </div>

                  {/* ── Items ── */}
                  <div className="so-items">
                    {myItems.map((item) => (
                      <div key={item.id} className="so-item">
                        <img src={item.image} alt={item.name} className="so-item-img" />
                        <div className="so-item-info">
                          <p className="so-item-name">{item.name}</p>
                          <p className="so-item-qty">
                            {item.quantity} × Rs. {item.price.toLocaleString()}
                          </p>
                        </div>
                        <p className="so-item-price">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ── Footer ── */}
                  <div className="so-footer">
                    <div className="so-delivery-status">
                      {order.status === "delivered" ? (
                        <span className="so-delivered">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Delivered — Rs. {myNet.toLocaleString()} credited to wallet
                        </span>
                      ) : order.status === "cancelled" ? (
                        <span className="so-cancelled">Order Cancelled</span>
                      ) : (
                        <span className="so-in-progress"> In Progress</span>
                      )}
                    </div>
                    <div className="so-earnings">
                      <span>Your earnings (after 10% fee)</span>
                      <strong>Rs. {myNet.toLocaleString()}</strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}