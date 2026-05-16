import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";

const PAYMENT_METHODS = [
  {
    id:    "cod",
    label: "Cash on Delivery",
    icon:  "💵",
    desc:  "Collect cash when the order is delivered.",
    fields: [],
  },
  {
    id:    "esewa",
    label: "eSewa",
    icon:  "🟢",
    desc:  "Receive payments directly to your eSewa wallet.",
    fields: [
      { name: "esewaPhone", label: "eSewa Phone / ID", placeholder: "98XXXXXXXX" },
    ],
  },
  {
    id:    "khalti",
    label: "Khalti",
    icon:  "🟣",
    desc:  "Receive payments directly to your Khalti wallet.",
    fields: [
      { name: "khaltiPhone", label: "Khalti Phone / ID", placeholder: "98XXXXXXXX" },
    ],
  },
  {
    id:    "bank",
    label: "Bank Transfer",
    icon:  "🏦",
    desc:  "Receive direct bank transfers from buyers.",
    fields: [
      { name: "bankName",    label: "Bank Name",      placeholder: "e.g. NIC Asia" },
      { name: "accountName", label: "Account Name",   placeholder: "Full name on account" },
      { name: "accountNo",   label: "Account Number", placeholder: "XXXXXXXXXXXXXXXX" },
    ],
  },
];

export default function PaymentSetup() {
  const { completePaymentSetup } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(["cod"]); // at least COD pre-ticked
  const [details, setDetails]   = useState({});
  const [errors, setErrors]     = useState({});

  const toggleMethod = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
    setErrors({});
  };

  const handleDetail = (e) => {
    const { name, value } = e.target;
    setDetails((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (selected.length === 0) {
      e._general = "Please select at least one payment method.";
      return e;
    }
    selected.forEach((id) => {
      const method = PAYMENT_METHODS.find((m) => m.id === id);
      method?.fields.forEach((f) => {
        if (!details[f.name]?.trim()) {
          e[f.name] = `${f.label} is required`;
        }
      });
    });
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    completePaymentSetup({ methods: selected, details });
    navigate("/seller");
  };

  const handleSkip = () => {
    completePaymentSetup({ methods: ["cod"], details: {}, skipped: true });
    navigate("/seller");
  };

  return (
    <div className="setup-page">
      {/* Progress strip */}
      <div className="setup-progress">
        <div className="setup-progress-bar" style={{ width: "66%" }} />
      </div>

      <div className="setup-wrap">

        {/* ── Sidebar ── */}
        <aside className="setup-sidebar">
          <div className="setup-logo">Bazaar<span>X</span></div>

          <div className="setup-steps">
            {/* Step 1 — done */}
            <div className="setup-step setup-step--done">
              <div className="setup-step-num setup-step-num--done">✓</div>
              <div className="setup-step-text">
                <p className="setup-step-label setup-label--dim">Store Setup</p>
                <p className="setup-step-sub">Your store details</p>
              </div>
            </div>
            <div className="setup-step-line setup-step-line--done" />

            {/* Step 2 — active */}
            <div className="setup-step setup-step--active">
              <div className="setup-step-num">2</div>
              <div className="setup-step-text">
                <p className="setup-step-label">Payment Setup</p>
                <p className="setup-step-sub">How you get paid</p>
              </div>
            </div>
            <div className="setup-step-line" />

            {/* Step 3 */}
            <div className="setup-step">
              <div className="setup-step-num setup-step-num--inactive">3</div>
              <div className="setup-step-text">
                <p className="setup-step-label setup-label--dim">Dashboard</p>
                <p className="setup-step-sub">Start selling</p>
              </div>
            </div>
          </div>

          <div className="setup-info-box">
            <p className="setup-info-title">Payout Schedule</p>
            <p className="setup-info-rate">Weekly</p>
            <p className="setup-info-desc">
              Earnings from delivered orders are settled every Friday directly to your selected payment method.
            </p>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="setup-main">
          <div className="setup-main-inner">
            <h1 className="setup-title">Payment Setup</h1>
            <p className="setup-subtitle">
              Select how buyers can pay you. You can enable multiple methods.
            </p>

            <form className="setup-form" onSubmit={handleSubmit}>

              {errors._general && (
                <div className="setup-error-banner">{errors._general}</div>
              )}

              {/* Payment method cards */}
              <div className="setup-payment-grid">
                {PAYMENT_METHODS.map((method) => {
                  const isActive = selected.includes(method.id);
                  return (
                    <div key={method.id}>
                      {/* Method toggle card */}
                      <button
                        type="button"
                        className={`setup-method-card ${isActive ? "setup-method-card--active" : ""}`}
                        onClick={() => toggleMethod(method.id)}
                      >
                        <div className="setup-method-left">
                          <span className="setup-method-icon">{method.icon}</span>
                          <div>
                            <p className="setup-method-label">{method.label}</p>
                            <p className="setup-method-desc">{method.desc}</p>
                          </div>
                        </div>
                        <div className={`setup-method-check ${isActive ? "setup-method-check--active" : ""}`}>
                          {isActive && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Detail fields — only show when method is selected and has fields */}
                      {isActive && method.fields.length > 0 && (
                        <div className="setup-method-fields">
                          {method.fields.map((f) => (
                            <div key={f.name} className="setup-field">
                              <label>{f.label} <span className="setup-req">*</span></label>
                              <input
                                name={f.name}
                                value={details[f.name] || ""}
                                onChange={handleDetail}
                                placeholder={f.placeholder}
                              />
                              {errors[f.name] && (
                                <span className="setup-error">{errors[f.name]}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="setup-actions">
                <button type="submit" className="setup-btn-primary">
                  Finish Setup
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
                <button type="button" className="setup-btn-skip" onClick={handleSkip}>
                  Skip for now
                </button>
              </div>

            </form>
          </div>
        </main>

      </div>
    </div>
  );
}