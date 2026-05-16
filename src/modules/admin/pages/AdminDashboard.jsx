import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useProducts } from "../../products/hooks/useProducts";
import { useOrders } from "../../orders/hooks/useOrders";
import { useCoupons } from "../../orders/hooks/useCoupons";
import { useWallet } from "../../wallet/context/WalletContext";
import AdminWithdrawals from "../components/AdminWithdrawals";
import "./Admin.css";

const COMMISSION = 10;

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-icon" style={{ background: color + "20", color }}>{icon}</div>
      <div>
        <p className="adm-stat-label">{label}</p>
        <p className="adm-stat-value">{value}</p>
        {sub && <p className="adm-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function PerfBar({ label, value, color, max = 100 }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="adm-perf-row">
      <span className="adm-perf-label">{label}</span>
      <div className="adm-perf-bar-wrap">
        <div className="adm-perf-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="adm-perf-val">{value.toLocaleString()}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const {
    user, logout, users, pendingSellers,
    suspendUser, activateUser, approveSeller, rejectSeller,
  } = useAuth();
  const { products }           = useProducts();
  const { orders }             = useOrders();
  const { coupons }            = useCoupons();
  const { pendingWithdrawals } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");

  const activeOrders    = orders.filter((o) => o.status !== "cancelled");
  const totalGMV        = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const platformRevenue = Math.round((totalGMV * COMMISSION) / 100);
  const sellerPayouts   = totalGMV - platformRevenue;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;
  const pendingOrders   = orders.filter((o) => ["confirmed","processing"].includes(o.status)).length;

  const approvedSellers = users.filter((u) => u.role === "seller" && u.approved);
  const totalBuyers     = users.filter((u) => u.role === "buyer").length;

  const sellerRevenue = {};
  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      sellerRevenue[item.seller] = (sellerRevenue[item.seller] || 0) + item.price * item.quantity;
    });
  });

  const topSellers = Object.entries(sellerRevenue)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, revenue]) => ({ name, revenue, commission: Math.round((revenue * COMMISSION) / 100) }));

  const suspicious = users.filter((u) => {
    const reasons = [];
    if ((u.failedLogins || 0) >= 5) reasons.push(`${u.failedLogins} failed logins`);
    if ((u.loginCount   || 0) > 50) reasons.push(`${u.loginCount} logins total`);
    if (u.flagged) reasons.push("Flagged by system");
    const userOrders = orders.filter((o) => o.buyer?.email === u.email);
    if (userOrders.length >= 3) {
      const times = userOrders.map((o) => new Date(o.placedAt).getTime()).sort();
      for (let i = 2; i < times.length; i++) {
        if (times[i] - times[i - 2] < 60000) { reasons.push("3+ orders in 1 minute"); break; }
      }
    }
    return reasons.length > 0 ? { ...u, reasons } : null;
  }).filter(Boolean);

  const activeCoupons  = coupons.filter((c) => c.active).length;
  const totalCouponUse = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const recentOrders   = [...orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)).slice(0, 8);

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const now  = new Date();
  const revenueByDay = Array(7).fill(0);
  activeOrders.forEach((order) => {
    const d = new Date(order.placedAt);
    if (Math.floor((now - d) / 86400000) < 7) revenueByDay[d.getDay()] += order.total;
  });
  const todayDay = now.getDay();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const dayIdx = (todayDay - 6 + i + 7) % 7;
    return { label: days[dayIdx], value: revenueByDay[dayIdx], isToday: dayIdx === todayDay };
  });
  const maxBar = Math.max(...chartData.map((d) => d.value), 1);

  const TABS = ["overview", "sellers", "suspicious", "coupons", "withdrawals"];

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/buyer" className="admin-logo">Bazaar<span>X</span></Link>
          <span className="admin-role-badge">Admin Panel</span>
          <div className="admin-topbar-links">
            {TABS.map((t) => (
              <button key={t} className={`atl ${activeTab === t ? "active" : ""}`}
                onClick={() => setActiveTab(t)}
                style={{ background: "none", border: "none", cursor: "pointer" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "suspicious"  && suspicious.length > 0            && <span className="adm-tab-badge">{suspicious.length}</span>}
                {t === "sellers"     && pendingSellers.length > 0         && <span className="adm-tab-badge">{pendingSellers.length}</span>}
                {t === "withdrawals" && pendingWithdrawals.length > 0     && <span className="adm-tab-badge">{pendingWithdrawals.length}</span>}
              </button>
            ))}
            <Link to="/admin/products" className="atl">Products</Link>
            <Link to="/admin/users"    className="atl">Users</Link>
            <Link to="/buyer"          className="atl">View Store</Link>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">{user?.name}</span>
            <button onClick={logout} className="admin-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="admin-container">

        {/* ══ OVERVIEW ══ */}
        {activeTab === "overview" && (
          <>
            <div className="adm-page-header">
              <div>
                <h1 className="adm-title">Platform Overview</h1>
                <p className="adm-sub">{now.toLocaleDateString("en-NP", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
              </div>
            </div>

            {pendingSellers.length > 0 && (
              <div className="adm-alert adm-alert--amber" onClick={() => setActiveTab("sellers")} style={{ cursor:"pointer" }}>
                <strong>{pendingSellers.length} seller{pendingSellers.length > 1 ? "s" : ""} awaiting approval</strong>
                <span className="adm-alert-cta">Review →</span>
              </div>
            )}
            {suspicious.length > 0 && (
              <div className="adm-alert adm-alert--red" onClick={() => setActiveTab("suspicious")} style={{ cursor:"pointer" }}>
                <strong>{suspicious.length} suspicious account{suspicious.length > 1 ? "s" : ""} detected</strong>
                <span className="adm-alert-cta">Investigate →</span>
              </div>
            )}
            {pendingWithdrawals.length > 0 && (
              <div className="adm-alert adm-alert--amber" onClick={() => setActiveTab("withdrawals")} style={{ cursor:"pointer" }}>
                <strong>{pendingWithdrawals.length} withdrawal request{pendingWithdrawals.length > 1 ? "s" : ""} pending</strong>
                <span className="adm-alert-cta">Process →</span>
              </div>
            )}

            <div className="adm-stats-grid">
              <StatCard label="Total GMV"        value={`Rs. ${totalGMV.toLocaleString()}`}        sub="Gross merchandise value"    color="#f0a500" icon="💰" />
              <StatCard label="Platform Revenue" value={`Rs. ${platformRevenue.toLocaleString()}`} sub={`${COMMISSION}% commission`} color="#2e7d32" icon="📈" />
              <StatCard label="Seller Payouts"   value={`Rs. ${sellerPayouts.toLocaleString()}`}   sub="Paid to sellers"            color="#1565c0" icon="🏪" />
              <StatCard label="Total Orders"     value={orders.length}                             sub={`${deliveredOrders} delivered`} color="#6a1b9a" icon="📦" />
              <StatCard label="Active Products"  value={products.length}                           sub="Across all sellers"         color="#00695c" icon="🛍️" />
              <StatCard label="Registered Users" value={users.length}                             sub={`${totalBuyers} buyers · ${approvedSellers.length} sellers`} color="#e65100" icon="👥" />
              <StatCard label="Active Coupons"   value={activeCoupons}                            sub={`${totalCouponUse} uses total`} color="#ad1457" icon="🎫" />
              <StatCard label="Cancelled Orders" value={cancelledOrders}                          sub={`${pendingOrders} still pending`} color="#c62828" icon="❌" />
            </div>

            <div className="adm-card">
              <div className="adm-card-header"><h3 className="adm-card-title">Revenue — Last 7 Days</h3></div>
              <div className="adm-chart-wrap">
                <div className="adm-y-axis">
                  {[4,3,2,1,0].map((i) => <span key={i} className="adm-y-label">Rs. {Math.round((maxBar*i)/4/1000)}k</span>)}
                </div>
                <div className="adm-chart">
                  {chartData.map((d, i) => (
                    <div key={i} className="adm-bar-col">
                      <div className="adm-bar-wrap">
                        <div className={`adm-bar ${d.isToday ? "adm-bar--today" : ""}`}
                          style={{ height:`${Math.round((d.value/maxBar)*100)}%` }} />
                      </div>
                      <span className="adm-bar-label">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card-header">
                <h3 className="adm-card-title">Recent Orders</h3>
                <Link to="/admin/products" className="adm-card-link">View all →</Link>
              </div>
              {recentOrders.length === 0 ? <p className="adm-empty">No orders yet.</p> : (
                <div className="adm-orders-table">
                  <div className="adm-orders-head">
                    <span>Order ID</span><span>Buyer</span><span>Items</span><span>Total</span><span>Payment</span><span>Status</span>
                  </div>
                  {recentOrders.map((o) => (
                    <div key={o.id} className="adm-orders-row">
                      <span className="adm-order-id">{o.id}</span>
                      <span className="adm-cell">{o.buyer?.name}</span>
                      <span className="adm-cell">{o.items.length} items</span>
                      <span className="adm-cell">Rs. {o.total.toLocaleString()}</span>
                      <span className="adm-cell">{o.paymentMethod?.toUpperCase()}</span>
                      <span className={`adm-status-chip adm-status-${o.status}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ SELLERS ══ */}
        {activeTab === "sellers" && (
          <>
            <div className="adm-page-header"><h1 className="adm-title">Seller Analytics</h1></div>

            {pendingSellers.length > 0 && (
              <div className="adm-card" style={{ marginBottom:"1rem" }}>
                <h3 className="adm-card-title" style={{ marginBottom:"1rem" }}> Pending Approval ({pendingSellers.length})</h3>
                {pendingSellers.map((s) => (
                  <div key={s.id} className="adm-seller-pending-row">
                    <div className="adm-seller-info">
                      <div className="adm-seller-avatar">{s.name.charAt(0)}</div>
                      <div>
                        <p className="adm-seller-name">{s.name}</p>
                        <p className="adm-seller-email">{s.email}</p>
                        <p className="adm-seller-meta" style={{ marginTop:"4px" }}>
                          🏪 <strong>{s.shopName || s.businessName || "—"}</strong>
                          {s.businessType ? ` · ${s.businessType}` : ""}
                          {s.city ? ` · ${s.city}` : ""}
                          {s.province ? `, ${s.province}` : ""}
                        </p>
                        <p className="adm-seller-meta"> {s.phone || "No phone"}{s.nidNumber ? ` · 🪪 NID: ${s.nidNumber}` : ""}</p>
                        {s.businessDescription && (
                          <p className="adm-seller-meta" style={{ fontStyle:"italic", color:"#666", maxWidth:"500px" }}>"{s.businessDescription}"</p>
                        )}
                        <p className="adm-seller-meta">🗓 Applied: {s.joinedAt}</p>
                      </div>
                    </div>
                    <div className="adm-seller-actions">
                      <button className="admin-btn-approve" onClick={() => approveSeller(s.id)}>✓ Approve</button>
                      <button className="admin-btn-remove"  onClick={() => rejectSeller(s.id)}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="adm-card">
              <h3 className="adm-card-title" style={{ marginBottom:"1.25rem" }}>Top Sellers by Revenue</h3>
              {topSellers.length === 0 ? <p className="adm-empty">No sales data yet.</p> : (
                <>
                  {topSellers.map((s, i) => (
                    <PerfBar key={s.name} label={`#${i+1} ${s.name}`} value={s.revenue}
                      color={i===0?"#f0a500":i===1?"#aaa":"#cd7f32"} max={topSellers[0]?.revenue||1} />
                  ))}
                  <div className="adm-commission-summary">
                    <p>Total platform commission from top sellers: <strong>Rs. {topSellers.reduce((s,t)=>s+t.commission,0).toLocaleString()}</strong></p>
                  </div>
                </>
              )}
            </div>

            <div className="adm-card">
              <h3 className="adm-card-title" style={{ marginBottom:"1rem" }}>All Sellers</h3>
              <div className="adm-sellers-table">
                <div className="adm-sellers-head">
                  <span>Seller</span><span>Shop</span><span>Revenue</span><span>Commission Paid</span><span>Status</span>
                </div>
                {approvedSellers.map((s) => (
                  <div key={s.id} className="adm-sellers-row">
                    <div className="adm-seller-cell">
                      <div className="adm-seller-avatar">{s.name.charAt(0)}</div>
                      <div>
                        <p className="adm-seller-name">{s.name}</p>
                        <p className="adm-seller-email">{s.email}</p>
                      </div>
                    </div>
                    <span className="adm-cell">{s.shopName||s.businessName||"—"}</span>
                    <span className="adm-cell">Rs. {(sellerRevenue[s.name]||0).toLocaleString()}</span>
                    <span className="adm-cell adm-commission">Rs. {Math.round(((sellerRevenue[s.name]||0)*COMMISSION)/100).toLocaleString()}</span>
                    <span className={`adm-status-chip ${s.status==="suspended"?"adm-status-cancelled":"adm-status-delivered"}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ SUSPICIOUS ══ */}
        {activeTab === "suspicious" && (
          <>
            <div className="adm-page-header">
              <h1 className="adm-title">Suspicious Activity</h1>
              <p className="adm-sub">Automatically detected based on behaviour patterns</p>
            </div>
            <div className="adm-detection-rules">
              <h3>🔍 How we detect suspicious activity:</h3>
              <div className="adm-rules-grid">
                {[
                  {rule:"5+ failed login attempts",action:"Auto-flagged"},
                  {rule:"10+ failed logins",action:"Auto-suspended"},
                  {rule:"50+ total logins",action:"Flagged for review"},
                  {rule:"3+ orders placed within 1 minute",action:"Flagged as bot"},
                  {rule:"Unusually large order values",action:"Manual review"},
                  {rule:"Multiple accounts same IP",action:"Investigation"},
                ].map((r,i) => (
                  <div key={i} className="adm-rule-card">
                    <span className="adm-rule-icon">{r.icon}</span>
                    <p className="adm-rule-text">{r.rule}</p>
                    <span className="adm-rule-action">{r.action}</span>
                  </div>
                ))}
              </div>
            </div>
            {suspicious.length === 0 ? (
              <div className="adm-card"><div className="adm-empty-state"><span style={{fontSize:"3rem"}}>✅</span><p>No suspicious activity detected!</p></div></div>
            ) : (
              <div className="adm-card">
                <h3 className="adm-card-title" style={{marginBottom:"1rem"}}>🚨 Flagged Accounts ({suspicious.length})</h3>
                {suspicious.map((u) => {
                  const reasons = [];
                  if ((u.failedLogins||0)>=5) reasons.push(`${u.failedLogins} failed login attempts`);
                  if ((u.loginCount||0)>50)   reasons.push(`High login frequency: ${u.loginCount} logins`);
                  if (u.flagged) reasons.push("System flagged");
                  const userOrders = orders.filter((o)=>o.buyer?.email===u.email);
                  if (userOrders.length>=3) {
                    const times = userOrders.map((o)=>new Date(o.placedAt).getTime()).sort();
                    for (let i=2;i<times.length;i++) {
                      if (times[i]-times[i-2]<60000){reasons.push("Rapid order placement detected");break;}
                    }
                  }
                  return (
                    <div key={u.id} className="adm-suspicious-card">
                      <div className="adm-suspicious-header">
                        <div className="adm-seller-cell">
                          <div className="adm-seller-avatar adm-avatar-red">{u.name.charAt(0)}</div>
                          <div>
                            <p className="adm-seller-name">{u.name}</p>
                            <p className="adm-seller-email">{u.email} · {u.role}</p>
                          </div>
                        </div>
                        <div className="adm-suspicious-actions">
                          {u.status==="suspended"
                            ? <button className="admin-btn-activate" onClick={()=>activateUser(u.id)}>Activate</button>
                            : <button className="admin-btn-suspend"  onClick={()=>suspendUser(u.id)}>Suspend</button>}
                        </div>
                      </div>
                      <div className="adm-suspicious-reasons">
                        {reasons.map((r,i)=><span key={i} className="adm-reason-tag">⚠ {r}</span>)}
                      </div>
                      <div className="adm-suspicious-stats">
                        <span>Orders: {orders.filter((o)=>o.buyer?.email===u.email).length}</span>
                        <span>Joined: {u.joinedAt}</span>
                        <span>Status: <strong>{u.status}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ COUPONS ══ */}
        {activeTab === "coupons" && <CouponsTab coupons={coupons} />}

        {/* ══ WITHDRAWALS ══ */}
        {activeTab === "withdrawals" && <AdminWithdrawals />}

      </div>
    </div>
  );
}

function CouponsTab({ coupons }) {
  const { addCoupon, toggleCoupon, deleteCoupon } = useCoupons();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code:"", type:"percent", value:"", minOrder:0, maxUses:100, expiresAt:"", description:"" });

  const handleAdd = (e) => {
    e.preventDefault();
    addCoupon({ ...form, value:parseInt(form.value), minOrder:parseInt(form.minOrder), maxUses:parseInt(form.maxUses) });
    setShowForm(false);
    setForm({ code:"", type:"percent", value:"", minOrder:0, maxUses:100, expiresAt:"", description:"" });
  };

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title">Coupon Management</h1>
          <p className="adm-sub">{coupons.length} coupons · {coupons.filter(c=>c.active).length} active</p>
        </div>
        <button className="adm-primary-btn" onClick={()=>setShowForm(!showForm)}>{showForm?"Cancel":"+ Create Coupon"}</button>
      </div>

      {showForm && (
        <div className="adm-card" style={{marginBottom:"1rem"}}>
          <h3 className="adm-card-title" style={{marginBottom:"1rem"}}>New Coupon</h3>
          <form className="adm-coupon-form" onSubmit={handleAdd}>
            <div className="adm-form-grid">
              <div className="adm-field">
                <label>Coupon Code *</label>
                <input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. SUMMER30" required />
              </div>
              <div className="adm-field">
                <label>Type *</label>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  <option value="percent">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="freeship">Free Shipping</option>
                </select>
              </div>
              <div className="adm-field">
                <label>Value * {form.type==="percent"?"(%)":form.type==="fixed"?"(Rs.)":"(auto)"}</label>
                <input type="number" value={form.value} onChange={e=>setForm(p=>({...p,value:e.target.value}))}
                  placeholder={form.type==="freeship"?"120":form.type==="percent"?"20":"500"}
                  disabled={form.type==="freeship"} required={form.type!=="freeship"} />
              </div>
              <div className="adm-field">
                <label>Min Order (Rs.)</label>
                <input type="number" value={form.minOrder} onChange={e=>setForm(p=>({...p,minOrder:e.target.value}))} placeholder="0" />
              </div>
              <div className="adm-field">
                <label>Max Uses</label>
                <input type="number" value={form.maxUses} onChange={e=>setForm(p=>({...p,maxUses:e.target.value}))} placeholder="100" />
              </div>
              <div className="adm-field">
                <label>Expiry Date *</label>
                <input type="date" value={form.expiresAt} onChange={e=>setForm(p=>({...p,expiresAt:e.target.value}))} required />
              </div>
              <div className="adm-field adm-field--full">
                <label>Description</label>
                <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="e.g. Summer sale — 20% off everything" />
              </div>
            </div>
            <div style={{display:"flex",gap:"10px",marginTop:"1rem"}}>
              <button type="submit" className="adm-primary-btn">Create Coupon</button>
            </div>
          </form>
        </div>
      )}

      <div className="adm-card">
        <div className="adm-coupon-list">
          {coupons.map((c) => (
            <div key={c.id} className={`adm-coupon-card ${!c.active?"adm-coupon-inactive":""}`}>
              <div className="adm-coupon-left">
                <div className="adm-coupon-code-badge">{c.code}</div>
                <div>
                  <p className="adm-coupon-desc">{c.description}</p>
                  <p className="adm-coupon-meta">
                    {c.type==="percent"?`${c.value}% off`:c.type==="fixed"?`Rs. ${c.value} off`:"Free shipping"}
                    {c.minOrder>0?` · Min Rs. ${c.minOrder.toLocaleString()}`:""} · Expires {c.expiresAt}
                  </p>
                </div>
              </div>
              <div className="adm-coupon-right">
                <div className="adm-coupon-usage">
                  <span className="adm-usage-count">{c.usedCount}</span>
                  <span className="adm-usage-max">/ {c.maxUses} uses</span>
                </div>
                <div className="adm-coupon-actions">
                  <button className={`adm-toggle-btn ${c.active?"adm-toggle-active":"adm-toggle-inactive"}`} onClick={()=>toggleCoupon(c.id)}>
                    {c.active?"Active":"Inactive"}
                  </button>
                  <button className="admin-btn-remove" onClick={()=>deleteCoupon(c.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}