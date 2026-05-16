import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Admin.css";

export default function ManageUsers() {
  const {
    user, logout, users,
    approveSeller, suspendUser, activateUser, rejectSeller,
    pendingSellers, flaggedUsers,
  } = useAuth();

  const [tab, setTab] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  const displayed =
    tab === "pending" ? users.filter((u) => u.role === "seller" && !u.approved) :
    tab === "flagged" ? users.filter((u) => u.flagged && u.status !== "suspended") :
    tab === "sellers" ? users.filter((u) => u.role === "seller") :
    tab === "buyers"  ? users.filter((u) => u.role === "buyer") :
    users.filter((u) => u.role !== "admin");

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/buyer" className="admin-logo">Bazaar<span>X</span></Link>
          <span className="admin-role-badge">Admin Panel</span>
          <div className="admin-topbar-links">
            <Link to="/admin" className="atl">Dashboard</Link>
            <Link to="/admin/products" className="atl">Products</Link>
            <Link to="/admin/users" className="atl active">Users</Link>
            <Link to="/buyer" className="atl">View Store</Link>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">{user?.name}</span>
            <button onClick={logout} className="admin-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Manage Users</h1>
            <p className="admin-page-sub">{users.length} total users</p>
          </div>
        </div>

        {/* Alerts */}
        {pendingSellers.length > 0 && (
          <div className="admin-pending-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <strong>{pendingSellers.length} seller{pendingSellers.length > 1 ? "s" : ""} waiting for approval</strong>
            <button className="admin-pending-btn" onClick={() => setTab("pending")}>Review Now →</button>
          </div>
        )}

        {flaggedUsers.length > 0 && (
          <div className="admin-pending-alert" style={{ borderColor: "#e53935", background: "#ffebee" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <strong style={{ color: "#e53935" }}>{flaggedUsers.length} user{flaggedUsers.length > 1 ? "s" : ""} flagged for suspicious activity</strong>
            <button className="admin-pending-btn" style={{ background: "#e53935", color: "#fff" }} onClick={() => setTab("flagged")}>
              Review →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {[
            { key: "all", label: "All Users" },
            { key: "sellers", label: "Sellers" },
            { key: "buyers", label: "Buyers" },
            { key: "pending", label: `Pending (${pendingSellers.length})` },
            { key: "flagged", label: `Flagged (${flaggedUsers.length})` },
          ].map((t) => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "admin-tab--active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="admin-table">
          {displayed.length === 0 && (
            <div className="admin-empty-row">No users in this category.</div>
          )}

          {displayed.map((u) => (
            <div key={u.id}>
              <div
                className="admin-users-row"
                style={{ cursor: "pointer" }}
                onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
              >
                <div className="admin-user-cell">
                  <div className="admin-user-avatar">{u.name.charAt(0)}</div>
                  <div>
                    <p className="admin-user-name">{u.name}</p>
                    <p className="admin-user-email">{u.email}</p>
                  </div>
                </div>
                <span className="admin-cell">
                  <span className={`admin-role-badge-sm ${u.role}`}>{u.role}</span>
                </span>
                <span className="admin-cell">
                  {!u.approved ? (
                    <span className="admin-status-pending">Pending</span>
                  ) : u.status === "suspended" ? (
                    <span className="admin-status-suspended">Suspended</span>
                  ) : u.flagged ? (
                    <span className="admin-status-flagged">Flagged</span>
                  ) : (
                    <span className="admin-status-active">Active</span>
                  )}
                </span>
                <div className="admin-cell admin-user-actions">
                  {u.role === "seller" && !u.approved && (
                    <>
                      <button className="admin-btn-approve" onClick={(e) => { e.stopPropagation(); approveSeller(u.id); }}>✓ Approve</button>
                      <button className="admin-btn-remove" onClick={(e) => { e.stopPropagation(); rejectSeller(u.id); }}>✗ Reject</button>
                    </>
                  )}
                  {u.approved && u.id !== user?.id && (
                    u.status === "suspended" ? (
                      <button className="admin-btn-activate" onClick={(e) => { e.stopPropagation(); activateUser(u.id); }}>Activate</button>
                    ) : (
                      <button className="admin-btn-suspend" onClick={(e) => { e.stopPropagation(); suspendUser(u.id); }}>Suspend</button>
                    )
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === u.id && (
                <div className="admin-user-expanded">
                  <div className="admin-user-details-grid">
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Phone</span>
                      <span>{u.phone || "—"}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Location</span>
                      <span>{u.city ? `${u.city}, ${u.province}` : u.location || "—"}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Joined</span>
                      <span>{u.joinedAt || "—"}</span>
                    </div>
                    <div className="admin-detail-item">
                      <span className="admin-detail-label">Login Count</span>
                      <span style={{ color: (u.loginCount || 0) > 100 ? "#e53935" : "inherit", fontWeight: (u.loginCount || 0) > 100 ? 700 : 400 }}>
                        {u.loginCount || 0} {(u.loginCount || 0) > 100 ? "⚠ Suspicious" : ""}
                      </span>
                    </div>
                    {u.role === "seller" && (
                      <>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Business Name</span>
                          <span>{u.businessName || "—"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Business Type</span>
                          <span>{u.businessType || "—"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">Business Address</span>
                          <span>{u.businessAddress || "—"}</span>
                        </div>
                        <div className="admin-detail-item">
                          <span className="admin-detail-label">NID Number</span>
                          <span>{u.nidNumber || "—"}</span>
                        </div>
                        <div className="admin-detail-item admin-detail-item--full">
                          <span className="admin-detail-label">Business Description</span>
                          <span>{u.businessDescription || "—"}</span>
                        </div>
                      </>
                    )}
                    {u.role === "buyer" && (
                      <div className="admin-detail-item">
                        <span className="admin-detail-label">Delivery Area</span>
                        <span>{u.area ? `${u.area}, ${u.city}` : "—"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}