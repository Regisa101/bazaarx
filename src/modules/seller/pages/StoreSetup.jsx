import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Setup.css";

const PROVINCES = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki",
  "Lumbini", "Karnali", "Sudurpashchim",
];

export default function StoreSetup() {
  const { user, completeStoreSetup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shopName:  user?.shopName  || "",
    street:    "",
    street2:   "",
    city:      user?.city      || "",
    province:  user?.province  || "Bagmati",
    zipCode:   "",
    phone:     user?.phone     || "",
    showEmail: true,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.shopName.trim()) e.shopName = "Shop name is required";
    if (!form.street.trim())   e.street   = "Street address is required";
    if (!form.city.trim())     e.city     = "City is required";
    if (!form.zipCode.trim())  e.zipCode  = "Post / ZIP code is required";
    if (!form.phone.trim())    e.phone    = "Phone number is required";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    completeStoreSetup(form);
    navigate("/seller/setup/payment");
  };

  const handleSkip = () => {
    completeStoreSetup({ ...form, skipped: true });
    navigate("/seller/setup/payment");
  };

  return (
    <div className="setup-page">
      {/* Top progress strip */}
      <div className="setup-progress">
        <div className="setup-progress-bar" style={{ width: "33%" }} />
      </div>

      <div className="setup-wrap">

        {/* ── Sidebar ── */}
        <aside className="setup-sidebar">
          <div className="setup-logo">Bazaar<span>X</span></div>

          <div className="setup-steps">
            {/* Step 1 — active */}
            <div className="setup-step setup-step--active">
              <div className="setup-step-num">1</div>
              <div className="setup-step-text">
                <p className="setup-step-label">Store Setup</p>
                <p className="setup-step-sub">Your store details</p>
              </div>
            </div>
            <div className="setup-step-line" />

            {/* Step 2 */}
            <div className="setup-step">
              <div className="setup-step-num setup-step-num--inactive">2</div>
              <div className="setup-step-text">
                <p className="setup-step-label setup-label--dim">Payment Setup</p>
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

          {/* Commission info */}
          <div className="setup-info-box">
            <p className="setup-info-title">Platform Commission</p>
            <p className="setup-info-rate">10%</p>
            <p className="setup-info-desc">
              BazaarX takes 10% from each confirmed sale. You keep 90% of every order.
            </p>
          </div>
        </aside>

        {/* ── Main form ── */}
        <main className="setup-main">
          <div className="setup-main-inner">
            <h1 className="setup-title">Set up your store</h1>
            <p className="setup-subtitle">
              This information will appear on your public seller profile.
            </p>

            <form className="setup-form" onSubmit={handleSubmit}>

              {/* Shop name */}
              <div className="setup-field">
                <label>Shop Name <span className="setup-req">*</span></label>
                <input
                  name="shopName"
                  value={form.shopName}
                  onChange={handleChange}
                  placeholder="e.g. Ram's Crafts"
                />
                {errors.shopName && <span className="setup-error">{errors.shopName}</span>}
              </div>

              {/* Street */}
              <div className="setup-field">
                <label>Street Address <span className="setup-req">*</span></label>
                <input
                  name="street"
                  value={form.street}
                  onChange={handleChange}
                  placeholder="House no., Street name, Ward"
                />
                {errors.street && <span className="setup-error">{errors.street}</span>}
              </div>

              {/* Street 2 */}
              <div className="setup-field">
                <label>
                  Street 2{" "}
                  <span className="setup-optional">(optional)</span>
                </label>
                <input
                  name="street2"
                  value={form.street2}
                  onChange={handleChange}
                  placeholder="Apartment, suite, landmark…"
                />
              </div>

              {/* City + ZIP */}
              <div className="setup-row">
                <div className="setup-field">
                  <label>City <span className="setup-req">*</span></label>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Kathmandu"
                  />
                  {errors.city && <span className="setup-error">{errors.city}</span>}
                </div>
                <div className="setup-field">
                  <label>Post / ZIP Code <span className="setup-req">*</span></label>
                  <input
                    name="zipCode"
                    value={form.zipCode}
                    onChange={handleChange}
                    placeholder="44600"
                  />
                  {errors.zipCode && <span className="setup-error">{errors.zipCode}</span>}
                </div>
              </div>

              {/* Country + Province */}
              <div className="setup-row">
                <div className="setup-field">
                  <label>Country</label>
                  <select disabled>
                    <option>Nepal</option>
                  </select>
                </div>
                <div className="setup-field">
                  <label>Province <span className="setup-req">*</span></label>
                  <select name="province" value={form.province} onChange={handleChange}>
                    {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div className="setup-field">
                <label>Store Phone <span className="setup-req">*</span></label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                />
                {errors.phone && <span className="setup-error">{errors.phone}</span>}
              </div>

              {/* Show email toggle */}
              <label className="setup-checkbox-row">
                <input
                  type="checkbox"
                  name="showEmail"
                  checked={form.showEmail}
                  onChange={handleChange}
                />
                <span>Show email address on my public store page</span>
              </label>

              {/* Actions */}
              <div className="setup-actions">
                <button type="submit" className="setup-btn-primary">
                  Continue
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