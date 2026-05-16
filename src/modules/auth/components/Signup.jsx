import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Auth.css";

const PROVINCES     = ["Koshi","Madhesh","Bagmati","Gandaki","Lumbini","Karnali","Sudurpashchim"];
const BUSINESS_TYPES = ["Handicrafts","Clothing & Fashion","Food & Beverages","Electronics","Home & Decor","Beauty & Wellness","Books & Stationery","Sports & Outdoors","Art & Craft","Other"];

export default function Signup() {
  const { signupBuyer, signupSeller, error, setError } = useAuth();
  const navigate = useNavigate();
  const [role, setRole]     = useState("buyer");
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Shared
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [phone, setPhone]       = useState("");

  // Buyer extra
  const [province, setProvince] = useState("Bagmati");
  const [city, setCity]         = useState("");
  const [area, setArea]         = useState("");

  // Seller extra
  const [shopName, setShopName]           = useState("");
  const [bizType, setBizType]             = useState("Handicrafts");
  const [bizDesc, setBizDesc]             = useState("");
  const [nid, setNid]                     = useState("");
  const [selProvince, setSelProvince]     = useState("Bagmati");
  const [selCity, setSelCity]             = useState("");

  const validate = () => {
    const e = {};
    if (!name.trim())                              e.name = "Required";
    if (!email.trim())                             e.email = "Required";
    if (password.length < 6)                       e.password = "Min 6 characters";
    if (password !== confirm)                      e.confirm = "Passwords don't match";
    if (!/^[0-9]{10}$/.test(phone))               e.phone = "Valid 10-digit number required";
    if (role === "buyer") {
      if (!city.trim())  e.city = "Required";
      if (!area.trim())  e.area = "Required";
    }
    if (role === "seller") {
      if (!shopName.trim()) e.shopName = "Required";
      if (!nid.trim())      e.nid = "Required";
      if (!selCity.trim())  e.selCity = "Required";
      if (!bizDesc.trim())  e.bizDesc = "Required";
    }
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      if (role === "buyer") {
        const result = signupBuyer({ name, email, password, phone, province, city, area });
        setLoading(false);
        if (result) navigate("/buyer");
      } else {
        const result = signupSeller({
          name, email, password, phone,
          shopName, province: selProvince, city: selCity,
          nidNumber: nid, businessType: bizType, businessDescription: bizDesc,
        });
        setLoading(false);
        if (result) setDone(true);
      }
    }, 600);
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Link to="/buyer" className="auth-logo">Bazaar<span>X</span></Link>
          <div className="auth-pending">
            <div className="pending-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2>Application Submitted!</h2>
            <div className="auth-pending-info">
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Admin reviews your application within 24–48 hours</li>
                <li>Your NID and shop details will be verified</li>
                <li>Once approved you'll be able to log in and set up your store</li>
                <li>BazaarX takes a <strong>10% commission</strong> on each sale</li>
              </ul>
            </div>
            <Link to="/login" className="auth-btn">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (label, required, error, children) => (
    <div className="auth-field">
      <label>{label} {required && <span style={{color:"#e53935"}}>*</span>}</label>
      {children}
      {error && <span className="cf-error">{error}</span>}
    </div>
  );

  return (
    <div className="auth-page">
      <div className={`auth-card ${role === "seller" ? "auth-card--wide" : ""}`}>
        <Link to="/buyer" className="auth-logo">Bazaar<span>X</span></Link>
        <h1 className="auth-title">Create Account</h1>

        {/* Role picker */}
        <div className="auth-role-picker">
          {[
            { key:"buyer",  label:"Buyer",  sub:"Shop products"},
            { key:"seller", label:"Seller", sub:"Sell products"},
          ].map(r => (
            <button key={r.key} type="button"
              className={`role-btn ${role === r.key ? "role-btn--active" : ""}`}
              onClick={() => { setRole(r.key); setErrors({}); setError(""); }}>
              <span style={{fontSize:"1.5rem"}}>{r.icon}</span>
              <span className="role-btn-label">{r.label}</span>
              <span className="role-btn-sub">{r.sub}</span>
            </button>
          ))}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>

          {/* Common fields */}
          <div className="auth-form-grid">
            {field("Full Name", true, errors.name,
              <input value={name} onChange={e=>{setName(e.target.value);setErrors(p=>({...p,name:""}))}} placeholder="Your full name" />
            )}
            {field("Phone Number", true, errors.phone,
              <input value={phone} onChange={e=>{setPhone(e.target.value);setErrors(p=>({...p,phone:""}))}} placeholder="98XXXXXXXX" maxLength={10} />
            )}
          </div>

          {field("Email Address", true, errors.email,
            <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErrors(p=>({...p,email:""}))}} placeholder="you@example.com" />
          )}

          <div className="auth-form-grid">
            {field("Password", true, errors.password,
              <input type="password" value={password} onChange={e=>{setPassword(e.target.value);setErrors(p=>({...p,password:""}))}} placeholder="Min 6 characters" />
            )}
            {field("Confirm Password", true, errors.confirm,
              <input type="password" value={confirm} onChange={e=>{setConfirm(e.target.value);setErrors(p=>({...p,confirm:""}))}} placeholder="Repeat password" />
            )}
          </div>

          {/* Buyer extra fields */}
          {role === "buyer" && (
            <>
              <p className="auth-section-label">Delivery Location</p>
              <div className="auth-form-grid">
                {field("Province", true, null,
                  <select value={province} onChange={e=>setProvince(e.target.value)}>
                    {PROVINCES.map(p=><option key={p}>{p}</option>)}
                  </select>
                )}
                {field("City / District", true, errors.city,
                  <input value={city} onChange={e=>{setCity(e.target.value);setErrors(p=>({...p,city:""}))}} placeholder="Kathmandu" />
                )}
              </div>
              {field("Area / Street", true, errors.area,
                <input value={area} onChange={e=>{setArea(e.target.value);setErrors(p=>({...p,area:""}))}} placeholder="Thamel, Ward 26" />
              )}
            </>
          )}

          {/* Seller extra fields */}
          {role === "seller" && (
            <>
              <p className="auth-section-label">Shop Information</p>
              {field("Shop Name", true, errors.shopName,
                <input value={shopName} onChange={e=>{setShopName(e.target.value);setErrors(p=>({...p,shopName:""}))}} placeholder="e.g. Ram's Crafts" />
              )}
              <div className="auth-form-grid">
                {field("Business Type", true, null,
                  <select value={bizType} onChange={e=>setBizType(e.target.value)}>
                    {BUSINESS_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                )}
                {field("Province", true, null,
                  <select value={selProvince} onChange={e=>setSelProvince(e.target.value)}>
                    {PROVINCES.map(p=><option key={p}>{p}</option>)}
                  </select>
                )}
              </div>
              <div className="auth-form-grid">
                {field("City / District", true, errors.selCity,
                  <input value={selCity} onChange={e=>{setSelCity(e.target.value);setErrors(p=>({...p,selCity:""}))}} placeholder="Kathmandu" />
                )}
                {field("NID / Citizenship No.", true, errors.nid,
                  <input value={nid} onChange={e=>{setNid(e.target.value);setErrors(p=>({...p,nid:""}))}} placeholder="XX-XX-XXXXX" />
                )}
              </div>
              {field("Tell buyers about your shop", true, errors.bizDesc,
                <textarea value={bizDesc} onChange={e=>{setBizDesc(e.target.value);setErrors(p=>({...p,bizDesc:""}))}}
                  placeholder="What you sell, your experience, why customers should choose you…"
                  rows={3} style={{padding:"10px 12px",border:"1.5px solid #e8e8e8",fontFamily:"Poppins,sans-serif",fontSize:"0.875rem",outline:"none",resize:"vertical",borderRadius:0}} />
              )}
              <div className="seller-trust-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                BazaarX charges a <strong>10% commission</strong> on every sale. Full store setup happens after admin approval.
              </div>
            </>
          )}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Please wait…" : role === "seller" ? "Submit Application" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch" style={{marginTop:"1rem"}}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}