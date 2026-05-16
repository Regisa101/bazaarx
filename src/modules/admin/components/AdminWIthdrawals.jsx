import { useState } from "react";
import { useWallet } from "../../wallet/context/WalletContext";
import { useAuth } from "../../auth/hooks/useAuth";


const METHOD_LABELS = {
  esewa:  "eSewa",
  khalti: "Khalti",
  bank:   "Bank Transfer",
  cash:   "Cash Pickup",
};

const STATUS_STYLES = {
  pending:  { bg: "#fff8e1", color: "#f57f17",  label: "Pending"  },
  approved: { bg: "#e8f5e9", color: "#2e7d32",  label: "Approved" },
  rejected: { bg: "#ffebee", color: "#c62828",  label: "Rejected" },
};

export default function AdminWithdrawals() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal,
          pendingWithdrawals, totalPlatformRevenue, wallets } = useWallet();
  const { users } = useAuth();

  const [filter,      setFilter]      = useState("pending"); // all | pending | approved | rejected
  const [noteFor,     setNoteFor]     = useState(null);       // withdrawal id currently editing note
  const [noteText,    setNoteText]    = useState("");
  const [actionType,  setActionType]  = useState(null);       // "approve" | "reject"

  const filtered = filter === "all"
    ? withdrawals
    : withdrawals.filter(w => w.status === filter);

  const openNote = (id, type) => {
    setNoteFor(id);
    setActionType(type);
    setNoteText("");
  };

  const confirmAction = () => {
    if (actionType === "approve") approveWithdrawal(noteFor, noteText);
    else rejectWithdrawal(noteFor, noteText);
    setNoteFor(null);
    setNoteText("");
    setActionType(null);
  };

  // Platform commission earned across all sellers
  const totalCommission = Object.values(wallets)
    .reduce((sum, w) => sum + (w.totalCommission || 0), 0);
  const totalWithdrawn  = Object.values(wallets)
    .reduce((sum, w) => sum + (w.withdrawn || 0), 0);
  const totalPending    = Object.values(wallets)
    .reduce((sum, w) => sum + (w.pending || 0), 0);

  const approvedSellers = users.filter(u => u.role === "seller" && u.approved);

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-title">Withdrawals</h1>
          <p className="adm-sub">
            {pendingWithdrawals.length > 0
              ? `${pendingWithdrawals.length} pending request${pendingWithdrawals.length > 1 ? "s" : ""} — action required`
              : "All caught up — no pending requests"}
          </p>
        </div>
      </div>

      {/* ── Platform revenue summary ── */}
      <div className="adm-stats-grid" style={{ marginBottom: "1rem" }}>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: "#f0a50020", color: "#f0a500" }}>💰</div>
          <div>
            <p className="adm-stat-label">Total Commission Earned</p>
            <p className="adm-stat-value">Rs. {totalCommission.toLocaleString()}</p>
            <p className="adm-stat-sub">10% from all seller sales</p>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: "#2e7d3220", color: "#2e7d32" }}>✅</div>
          <div>
            <p className="adm-stat-label">Paid Out to Sellers</p>
            <p className="adm-stat-value">Rs. {totalWithdrawn.toLocaleString()}</p>
            <p className="adm-stat-sub">Approved withdrawals</p>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: "#f57f1720", color: "#f57f17" }}>⏳</div>
          <div>
            <p className="adm-stat-label">Pending Payouts</p>
            <p className="adm-stat-value">Rs. {totalPending.toLocaleString()}</p>
            <p className="adm-stat-sub">{pendingWithdrawals.length} requests</p>
          </div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: "#1565c020", color: "#1565c0" }}>🏪</div>
          <div>
            <p className="adm-stat-label">Active Sellers</p>
            <p className="adm-stat-value">{approvedSellers.length}</p>
            <p className="adm-stat-sub">With approved accounts</p>
          </div>
        </div>
      </div>

      {/* ── Per-seller wallet overview ── */}
      <div className="adm-card" style={{ marginBottom: "1rem" }}>
        <div className="adm-card-header">
          <h3 className="adm-card-title">Seller Wallet Overview</h3>
        </div>
        {approvedSellers.length === 0 ? (
          <p className="adm-empty">No approved sellers yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              gap: "1rem",
              padding: "8px 12px",
              background: "#f9f9f9",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              <span>Seller</span>
              <span>Total Earned</span>
              <span>Commission Paid</span>
              <span>Withdrawn</span>
              <span>Available</span>
            </div>
            {approvedSellers.map(s => {
              const w = wallets[s.name] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
              const available = Math.max(0, w.totalEarned - (w.withdrawn || 0) - (w.pending || 0));
              return (
                <div key={s.id} style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  gap: "1rem",
                  padding: "12px",
                  borderTop: "1px solid #f5f5f5",
                  alignItems: "center",
                  fontSize: "0.8125rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="adm-seller-avatar">{s.name.charAt(0)}</div>
                    <div>
                      <p className="adm-seller-name">{s.name}</p>
                      <p className="adm-seller-email">{s.email}</p>
                    </div>
                  </div>
                  <span style={{ color: "#555" }}>Rs. {(w.totalEarned || 0).toLocaleString()}</span>
                  <span style={{ color: "#e65100", fontWeight: 600 }}>
                    Rs. {(w.totalCommission || 0).toLocaleString()}
                  </span>
                  <span style={{ color: "#555" }}>Rs. {(w.withdrawn || 0).toLocaleString()}</span>
                  <span style={{ color: "#2e7d32", fontWeight: 700 }}>
                    Rs. {available.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Withdrawal requests ── */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3 className="adm-card-title">Withdrawal Requests</h3>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: "4px" }}>
            {["all", "pending", "approved", "rejected"].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  border: "1.5px solid",
                  cursor: "pointer",
                  borderRadius: "0",
                  borderColor: filter === f ? "#111" : "#e8e8e8",
                  background:  filter === f ? "#111" : "#fff",
                  color:       filter === f ? "#fff" : "#555",
                  transition: "all 0.15s",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === "pending" && pendingWithdrawals.length > 0 && (
                  <span className="adm-tab-badge">{pendingWithdrawals.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="adm-empty-state">
            <span style={{ fontSize: "2.5rem" }}>
            </span>
            <p>
              {filter === "pending"
                ? "No pending requests — all caught up!"
                : `No ${filter} requests yet.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(req => {
              const style = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
              const isThisNoteOpen = noteFor === req.id;

              return (
                <div
                  key={req.id}
                  style={{
                    border: `1px solid ${req.status === "pending" ? "#ffe082" : "#f0f0f0"}`,
                    background: req.status === "pending" ? "#fffbf0" : "#fff",
                    padding: "1.25rem",
                  }}
                >
                  {/* Row 1: seller + amount + status */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="adm-seller-avatar">{req.sellerName?.charAt(0)}</div>
                      <div>
                        <p className="adm-seller-name">{req.sellerName}</p>
                        <p className="adm-seller-email" style={{ fontFamily: "'Courier New', monospace", fontSize: "0.72rem" }}>
                          {req.id}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111", margin: "0 0 4px", fontFamily: "'League Spartan', sans-serif" }}>
                        Rs. {req.amount.toLocaleString()}
                      </p>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", background: style.bg, color: style.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {style.label}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: payout details */}
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "10px", fontSize: "0.8125rem", color: "#555", fontFamily: "'Poppins', sans-serif" }}>
                    <span>{METHOD_ICONS[req.method]} {METHOD_LABELS[req.method]}</span>
                    <span>· {req.accountNumber}</span>
                    {req.accountName && <span>· {req.accountName}</span>}
                    <span style={{ color: "#aaa" }}>
                      · Requested {new Date(req.requestedAt).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {req.processedAt && (
                      <span style={{ color: "#aaa" }}>
                        · Processed {new Date(req.processedAt).toLocaleDateString("en-NP", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Admin note if any */}
                  {req.adminNote && (
                    <p style={{ fontSize: "0.78rem", color: "#888", fontStyle: "italic", margin: "0 0 10px", fontFamily: "'Poppins', sans-serif" }}>
                      Admin note: "{req.adminNote}"
                    </p>
                  )}

                  {/* Inline note + confirm UI */}
                  {isThisNoteOpen && (
                    <div style={{ background: "#f9f9f9", border: "1px solid #e8e8e8", padding: "12px", marginBottom: "10px" }}>
                      <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#555", display: "block", marginBottom: "6px", fontFamily: "'Poppins', sans-serif" }}>
                        {actionType === "approve" ? "✅ Approve" : "❌ Reject"} — add a note (optional)
                      </label>
                      <input
                        type="text"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder={actionType === "approve" ? "e.g. Transferred via eSewa" : "e.g. Invalid account number"}
                        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #e8e8e8", fontFamily: "'Poppins', sans-serif", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", marginBottom: "10px" }}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={confirmAction}
                          style={{
                            padding: "7px 18px",
                            background: actionType === "approve" ? "#2e7d32" : "#e53935",
                            color: "#fff",
                            border: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                        >
                          Confirm {actionType === "approve" ? "Approval" : "Rejection"}
                        </button>
                        <button
                          onClick={() => { setNoteFor(null); setNoteText(""); setActionType(null); }}
                          style={{ padding: "7px 16px", background: "#fff", border: "1.5px solid #ddd", color: "#555", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins', sans-serif" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action buttons — only for pending */}
                  {req.status === "pending" && !isThisNoteOpen && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="admin-btn-approve"
                        onClick={() => openNote(req.id, "approve")}
                      >
                        ✓ Approve Payout
                      </button>
                      <button
                        className="admin-btn-remove"
                        onClick={() => openNote(req.id, "reject")}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}