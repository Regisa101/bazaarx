import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOrders } from "../../orders/hooks/useOrders";
import "./SellerDashboard.css";

// ── Bar chart (divs, no library) ──────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="sd-chart">
      {data.map((d, i) => (
        <div key={i} className="sd-bar-col">
          <div className="sd-bar-wrap">
            <div
              className={`sd-bar ${d.isToday ? "sd-bar--today" : ""}`}
              style={{ height: `${Math.round((d.value / max) * 100)}%` }}
            />
          </div>
          <span className="sd-bar-label">{d.label}</span>
          {d.value > 0 && (
            <span className="sd-bar-value">
              Rs. {(d.value / 1000).toFixed(0)}k
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Performance bar ───────────────────────────────────────────
function PerfBar({ label, value, color }) {
  return (
    <div className="sd-perf-row">
      <span className="sd-perf-label">{label}</span>
      <div className="sd-perf-bar-wrap">
        <div className="sd-perf-bar" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="sd-perf-value">{value}%</span>
    </div>
  );
}

export default function SellerDashboard() {
  const { user }              = useAuth();
  const { getSellerProducts } = useProducts();
  const { getOrdersBySeller } = useOrders();

  const myProducts = getSellerProducts(user?.name || "");
  const myOrders   = getOrdersBySeller(user?.name || "");

  // ── Stats ────────────────────────────────────────────────────
  const nonCancelled = myOrders.filter((o) => o.status !== "cancelled");

  const totalRevenue = nonCancelled.reduce((sum, order) => {
    const myItems = order.items.filter((i) => i.seller === user?.name);
    return sum + myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  }, 0);

     const now = new Date();
  const ordersThisMonth = myOrders.filter((o) => {
    const d = new Date(o.placedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // "pending" = needs seller confirmation; "processing" = needs dispatch
  const pendingOrders = myOrders.filter(
    (o) => o.status === "pending" || o.status === "processing"
  ).length;

{/* Commission summary — shows how much admin earned vs seller earned */}
{totalRevenue > 0 && (
  <div className="sd-commission-row">
    <div className="sd-commission-card sd-commission-card--seller">
      <p className="sd-commission-label">Your Earnings (after 10% commission)</p>
      <p className="sd-commission-value">
        Rs. {Math.round(totalRevenue * 0.9).toLocaleString()}
      </p>
      <p className="sd-commission-sub">From Rs. {totalRevenue.toLocaleString()} total sales</p>
    </div>
    <div className="sd-commission-card sd-commission-card--platform">
      <p className="sd-commission-label">BazaarX Platform Fee (10%)</p>
      <p className="sd-commission-value sd-commission-value--gray">
        Rs. {Math.round(totalRevenue * 0.1).toLocaleString()}
      </p>
      <p className="sd-commission-sub">Commission deducted from your sales</p>
    </div>
    <div className="sd-commission-card sd-commission-card--payout">
      <p className="sd-commission-label">Payout Method</p>
      <p className="sd-commission-value sd-commission-value--small">
        {user?.payout?.method === "esewa"  ? " eSewa" :
         user?.payout?.method === "khalti" ? " Khalti" :
         user?.payout?.method === "bank"   ? " Bank Transfer" :
         user?.payout?.method === "cash"   ? " Cash Pickup" : " Not set up"}
      </p>
      <p className="sd-commission-sub">{user?.payout?.accountNumber || "Set up your payout"}</p>
    </div>
  </div>
)}
  
  // New orders waiting for seller confirmation
  const awaitingConfirmation = myOrders.filter((o) => o.status === "pending").length;

  const allReviews = myProducts.flatMap((p) => p.reviews || []);
  const avgRating  = allReviews.length > 0
    ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
    : "—";

  const lowStockProducts   = myProducts.filter((p) => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = myProducts.filter((p) => p.stock === 0);
  const stockAlerts        = lowStockProducts.length + outOfStockProducts.length;
  const categories         = [...new Set(myProducts.map((p) => p.category))];

  // ── Top products ─────────────────────────────────────────────
  const productRevenue = {};
  const productSold    = {};
  myOrders.forEach((order) => {
    order.items
      .filter((i) => i.seller === user?.name)
      .forEach((item) => {
        productRevenue[item.id] = (productRevenue[item.id] || 0) + item.price * item.quantity;
        productSold[item.id]    = (productSold[item.id]    || 0) + item.quantity;
      });
  });
  const topProducts = myProducts
    .filter((p) => productRevenue[p.id])
    .sort((a, b) => (productRevenue[b.id] || 0) - (productRevenue[a.id] || 0))
    .slice(0, 3);

  // ── Pipeline counts (includes pending) ───────────────────────
  const pipeline = {
    pending:    myOrders.filter((o) => o.status === "pending").length,
    confirmed:  myOrders.filter((o) => o.status === "confirmed").length,
    processing: myOrders.filter((o) => o.status === "processing").length,
    shipped:    myOrders.filter((o) => o.status === "shipped").length,
    delivered:  myOrders.filter((o) => o.status === "delivered").length,
    cancelled:  myOrders.filter((o) => o.status === "cancelled").length,
  };

  // ── Revenue chart — last 7 days ───────────────────────────────
  const days         = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const revenueByDay = Array(7).fill(0);
  const todayDay     = now.getDay();

  myOrders.forEach((order) => {
    if (order.status === "cancelled" || order.status === "pending") return;
    const d        = new Date(order.placedAt);
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) {
      const myItems = order.items.filter((i) => i.seller === user?.name);
      revenueByDay[d.getDay()] += myItems.reduce((s, i) => s + i.price * i.quantity, 0);
    }
  });

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const di = (todayDay - 6 + i + 7) % 7;
    return { label: days[di], value: revenueByDay[di], isToday: di === todayDay };
  });

  const maxBar     = Math.max(...revenueByDay, 1);
  const todayStr   = now.toLocaleDateString("en-NP", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="seller-page">

      {/* ── Topbar ── */}
      <div className="seller-topbar">
        <div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">Bazaar<span>X</span></Link>
          <span className="seller-role-badge">Seller Panel</span>
          <div className="seller-topbar-links">
            <Link to="/seller"          className="stl active">Dashboard</Link>
            <Link to="/seller/products" className="stl">My Products</Link>
            <Link to="/seller/add"      className="stl">Add Product</Link>
            <Link to="/seller/orders"   className="stl">
              Orders
              {awaitingConfirmation > 0 && (
                <span className="stl-badge">{awaitingConfirmation}</span>
              )}
            </Link>
            <Link to="/buyer" className="stl">View Store</Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">

        {/* ── Page header ── */}
        <div className="sd-page-header">
          <div>
            <h1 className="sd-title">Dashboard</h1>
            <p className="sd-subtitle">{todayStr} · Your store is live</p>
          </div>
          <Link to="/seller/add" className="seller-primary-btn">+ Add New Product</Link>
        </div>

        {/* ── Awaiting confirmation banner ── */}
        {awaitingConfirmation > 0 && (
          <div className="sd-alert sd-alert--urgent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>
              <strong>{awaitingConfirmation} new order{awaitingConfirmation > 1 ? "s" : ""}</strong>{" "}
              waiting for your confirmation
            </span>
            <Link to="/seller/orders?tab=pending" className="sd-alert-link">
              Confirm now →
            </Link>
          </div>
        )}

        {/* ── Stock alert banner ── */}
        {stockAlerts > 0 && (
          <div className="sd-alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              {stockAlerts} product{stockAlerts > 1 ? "s are" : " is"} low on stock —{" "}
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 3).map((p) => p.name).join(", ")}
              {stockAlerts > 3 ? ` +${stockAlerts - 3} more` : ""}
            </span>
            {/* ✅ Goes to products page filtered to low/out stock only */}
            <Link to="/seller/products?stock=low" className="sd-alert-link">
              Restock →
            </Link>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="sd-stats-grid">
          <div className="sd-stat-card">
            <p className="sd-stat-label">TOTAL REVENUE</p>
            <p className="sd-stat-value">Rs. {totalRevenue.toLocaleString()}</p>
            <p className="sd-stat-note sd-note-green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              From {nonCancelled.length} orders
            </p>
          </div>

          <div className="sd-stat-card">
            <p className="sd-stat-label">ORDERS THIS MONTH</p>
            <p className="sd-stat-value">{ordersThisMonth}</p>
            <p className="sd-stat-note sd-note-green">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              {myOrders.length} all-time
            </p>
          </div>

          <div className={`sd-stat-card ${awaitingConfirmation > 0 ? "sd-stat-card--urgent" : ""}`}>
            <p className="sd-stat-label">AWAITING CONFIRMATION</p>
            <p className="sd-stat-value" style={{ color: awaitingConfirmation > 0 ? "#880e4f" : "inherit" }}>
              {awaitingConfirmation}
            </p>
            <p className={`sd-stat-note ${awaitingConfirmation > 0 ? "sd-note-urgent" : "sd-note-gray"}`}>
              {awaitingConfirmation > 0 ? "Needs your action" : "All caught up"}
            </p>
          </div>

          <div className="sd-stat-card">
            <p className="sd-stat-label">TOTAL PRODUCTS</p>
            <p className="sd-stat-value">{myProducts.length}</p>
            <p className="sd-stat-note sd-note-gray">
              Across {categories.length} categor{categories.length === 1 ? "y" : "ies"}
            </p>
          </div>

          <div className="sd-stat-card">
            <p className="sd-stat-label">AVG RATING</p>
            <p className="sd-stat-value">
              {avgRating}
              {avgRating !== "—" && <span className="sd-stat-star">★</span>}
            </p>
            <p className="sd-stat-note sd-note-green">
              From {allReviews.length} review{allReviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className={`sd-stat-card ${stockAlerts > 0 ? "sd-stat-card--warn" : ""}`}>
            <p className="sd-stat-label">STOCK ALERTS</p>
            <p className="sd-stat-value" style={{ color: stockAlerts > 0 ? "#e65100" : "inherit" }}>
              {stockAlerts}
            </p>
            {stockAlerts > 0 ? (
              <p className="sd-stat-note sd-note-warn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Low or out of stock
              </p>
            ) : (
              <p className="sd-stat-note sd-note-green">All stocked up!</p>
            )}
          </div>
        </div>

        {/* ── Revenue chart + pipeline ── */}
        <div className="sd-two-col">
          <div className="sd-card">

            {/* ✅ Analytics section — ALWAYS visible, id="analytics" for scroll */}
            <div id="analytics" className="sd-card-header">
              <h3 className="sd-card-title">Revenue — last 7 days</h3>
              <Link to="/seller/orders" className="sd-card-link">View orders →</Link>
            </div>

            {/* Chart always renders — shows 0-height bars when no data */}
            <div className="sd-chart-wrap">
              <div className="sd-y-axis">
                {Array.from({ length: 5 }, (_, i) => {
                  const val = Math.round((maxBar / 4) * (4 - i));
                  return (
                    <span key={i} className="sd-y-label">
                      {val > 0 ? `Rs. ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}` : "Rs. 0"}
                    </span>
                  );
                })}
                <span className="sd-y-label">Rs. 0</span>
              </div>
              <BarChart data={chartData} />
            </div>
            {myOrders.length === 0 && (
              <p className="sd-chart-hint">
                No sales yet — bars will fill in as orders come.
              </p>
            )}

            {/* Pipeline */}
            <div className="sd-pipeline">
              <div className="sd-pipeline-header">
                <h3 className="sd-card-title">Order pipeline</h3>
                <Link to="/seller/orders" className="sd-card-link">Manage →</Link>
              </div>
              <div className="sd-pipeline-grid">
                {[
                  { key: "pending",    label: "PENDING",    color: "#880e4f" },
                  { key: "confirmed",  label: "CONFIRMED",  color: "#1565c0" },
                  { key: "processing", label: "PROCESSING", color: "#f57f17" },
                  { key: "shipped",    label: "SHIPPED",    color: "#283593" },
                  { key: "delivered",  label: "DELIVERED",  color: "#2e7d32" },
                  { key: "cancelled",  label: "CANCELLED",  color: "#c62828" },
                ].map((s) => (
                  <div key={s.key} className="sd-pipeline-item">
                    <p className="sd-pipeline-count" style={{ color: s.color }}>
                      {pipeline[s.key]}
                    </p>
                    <p className="sd-pipeline-label" style={{ color: s.color }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="sd-right-col">
            <div className="sd-card">
              <div className="sd-card-header">
                <h3 className="sd-card-title">Top products</h3>
                <Link to="/seller/products" className="sd-card-link">View all →</Link>
              </div>
              {topProducts.length === 0 ? (
                <p className="sd-empty-text">Top products appear once orders come in.</p>
              ) : (
                <div className="sd-top-products">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="sd-top-product-row">
                      <span className="sd-rank">{i + 1}</span>
                      <img src={p.image} alt={p.name} className="sd-top-img" />
                      <div className="sd-top-info">
                        <p className="sd-top-name">{p.name}</p>
                        <p className="sd-top-cat">{p.category}</p>
                      </div>
                      <div className="sd-top-right">
                        <p className="sd-top-revenue">
                          Rs. {Math.round((productRevenue[p.id] || 0) / 1000)}k
                        </p>
                        <p className="sd-top-sold">{productSold[p.id] || 0} sold</p>
                      </div>
                      <span className={`sd-stock-chip ${
                        p.stock === 0 ? "oos" : p.stock < 5 ? "low" : "ok"
                      }`}>
                        {p.stock === 0 ? "OUT" : p.stock < 5 ? `${p.stock} LEFT` : "IN STOCK"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sd-card">
              <h3 className="sd-card-title" style={{ marginBottom: "1.25rem" }}>
                Store performance
              </h3>
              <div className="sd-performance">
                <PerfBar
                  label="Fulfilment rate"
                  value={nonCancelled.length > 0
                    ? Math.round((pipeline.delivered / nonCancelled.length) * 100) : 0}
                  color="#2e7d32"
                />
                <PerfBar
                  label="On-time delivery"
                  value={myOrders.length > 0
                    ? Math.round((pipeline.delivered / myOrders.length) * 100) : 0}
                  color="#1565c0"
                />
                <PerfBar
                  label="Cancellation rate"
                  value={myOrders.length > 0
                    ? Math.round((pipeline.cancelled / myOrders.length) * 100) : 0}
                  color="#e53935"
                />
                <div className="sd-perf-stat-row">
                  <span className="sd-perf-label">Avg order value</span>
                  <span className="sd-perf-stat-val">
                    Rs.{" "}{nonCancelled.length > 0
                      ? Math.round(totalRevenue / nonCancelled.length).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="sd-perf-stat-row">
                  <span className="sd-perf-label">Total reviews</span>
                  <span className="sd-perf-stat-val">{allReviews.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="sd-card" style={{ marginTop: "1rem" }}>
          <h3 className="sd-card-title" style={{ marginBottom: "1.25rem" }}>
            Quick actions
          </h3>
          <div className="sd-quick-actions">

            {/* ✅ Restock → products page filtered to low/out stock only */}
            <Link to="/seller/products?stock=low" className="sd-quick-action">
              <div className="sd-quick-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8">
                  <path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                </svg>
              </div>
              <p className="sd-quick-label">Restock products</p>
              <span className="sd-quick-sub">
                {stockAlerts > 0 ? `${stockAlerts} items need attention` : "All stocked up"}
              </span>
            </Link>

            {/* ✅ Confirm orders → orders page filtered to pending tab */}
            <Link to="/seller/orders?tab=pending" className="sd-quick-action">
              <div className="sd-quick-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <p className="sd-quick-label">Confirm orders</p>
              <span className="sd-quick-sub">
                {awaitingConfirmation > 0
                  ? `${awaitingConfirmation} new order${awaitingConfirmation > 1 ? "s" : ""}`
                  : "No pending orders"}
              </span>
            </Link>

            {/* ✅ Add product → /seller/add */}
            <Link to="/seller/add" className="sd-quick-action">
              <div className="sd-quick-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8"  y1="12" x2="16" y2="12"/>
                </svg>
              </div>
              <p className="sd-quick-label">Add product</p>
              <span className="sd-quick-sub">Grow your catalogue</span>
            </Link>

            {/* ✅ View analytics → scrolls to chart on this page */}
            <a href="#analytics" className="sd-quick-action">
              <div className="sd-quick-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6"  y1="20" x2="6"  y2="14"/>
                </svg>
              </div>
              <p className="sd-quick-label">View analytics</p>
              <span className="sd-quick-sub">Revenue & performance</span>
            </a>

          </div>
        </div>

      </div>
    </div>
  );
}