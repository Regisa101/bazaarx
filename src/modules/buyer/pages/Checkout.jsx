import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../../cart/hooks/useCart";
import { useAuth } from "../../auth/hooks/useAuth";
import { useOrders } from "../../orders/hooks/useOrders";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "./Checkout.css";

const PROVINCES = [
  "Koshi", "Madhesh", "Bagmati", "Gandaki",
  "Lumbini", "Karnali", "Sudurpashchim",
];

// ── Available offers — modern card-based system ──
const OFFERS = [
  {
    id: 1,
    code: "WELCOME20",
    title: "Welcome Offer",
    desc: "20% off your order",
    type: "percent",
    value: 20,
    minOrder: 0,
    color: "#f0a500",
    bg: "#111",
    tag: "NEW USER",
  },
  {
    id: 2,
    code: "NEPAL10",
    title: "Nepal Special",
    desc: "10% off above Rs. 1,000",
    type: "percent",
    value: 10,
    minOrder: 1000,
    color: "#fff",
    bg: "#2e7d32",
    tag: "POPULAR",
  },
  {
    id: 3,
    code: "FREESHIP",
    title: "Free Delivery",
    desc: "Free shipping on this order",
    type: "freeship",
    value: 120,
    minOrder: 0,
    color: "#111",
    bg: "#e3f2fd",
    tag: "LIMITED",
  },
  {
    id: 4,
    code: "FLAT500",
    title: "Flat Rs. 500 Off",
    desc: "Instant Rs. 500 discount",
    type: "fixed",
    value: 500,
    minOrder: 2000,
    color: "#fff",
    bg: "#6a1b9a",
    tag: "SPECIAL",
  },
];

// Calculate discount from offer
function calcDiscount(offer, cartTotal, deliveryFee) {
  if (!offer) return 0;
  if (offer.type === "percent")  return Math.round(cartTotal * offer.value / 100);
  if (offer.type === "fixed")    return Math.min(offer.value, cartTotal);
  if (offer.type === "freeship") return deliveryFee;
  return 0;
}

// Offer card component
function OfferCard({ offer, isApplied, isDisabled, onApply, onRemove, cartTotal }) {
  const eligible = cartTotal >= offer.minOrder;
  const active   = isApplied;

  return (
    <div
      className={`offer-card ${active ? "offer-card--applied" : ""} ${!eligible ? "offer-card--disabled" : ""}`}
      style={{ "--offer-bg": offer.bg, "--offer-color": offer.color }}
    >
      <div className="offer-card-inner">
        <div className="offer-emoji">{offer.emoji}</div>
        <div className="offer-info">
          <div className="offer-tag-row">
            <span className="offer-tag">{offer.tag}</span>
            <span className="offer-code">{offer.code}</span>
          </div>
          <p className="offer-title">{offer.title}</p>
          <p className="offer-desc">{offer.desc}</p>
          {offer.minOrder > 0 && !eligible && (
            <p className="offer-min-warn">
              Add Rs. {(offer.minOrder - cartTotal).toLocaleString()} more to unlock
            </p>
          )}
        </div>
        <div className="offer-action">
          {active ? (
            <button className="offer-btn offer-btn--remove" onClick={onRemove}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Applied
            </button>
          ) : (
            <button
              className="offer-btn offer-btn--apply"
              onClick={() => onApply(offer)}
              disabled={!eligible}
            >
              Apply
            </button>
          )}
        </div>
      </div>
      {active && (
        <div className="offer-applied-bar">
          ✓ Saving {offer.type === "freeship" ? "Rs. 120 on delivery" :
                    offer.type === "fixed"    ? `Rs. ${offer.value}` :
                    `${offer.value}%`} with this offer
        </div>
      )}
    </div>
  );
}

export default function Checkout() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();

  const [step, setStep]         = useState(1);
  const [placing, setPlacing]   = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [manualCode, setManualCode]     = useState("");
  const [manualError, setManualError]   = useState("");

  const [address, setAddress] = useState({
    fullName:  user?.name || "",
    phone:     user?.phone || "",
    province:  user?.province || "Bagmati",
    city:      user?.city || "",
    area:      user?.area || "",
    landmark:  "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [errors, setErrors] = useState({});

  // Price calculations
  const deliveryFee   = cartTotal >= 2000 ? 0 : 120;
  const freeShip      = appliedOffer?.type === "freeship";
  const finalDelivery = freeShip ? 0 : deliveryFee;
  const discountAmt   = calcDiscount(appliedOffer, cartTotal, deliveryFee);
  const grandTotal    = Math.max(0, cartTotal + finalDelivery - discountAmt);

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = "Full name is required";
    if (!/^[0-9]{10}$/.test(address.phone)) e.phone = "Valid 10-digit phone required";
    if (!address.city.trim())   e.city = "City is required";
    if (!address.area.trim())   e.area = "Area is required";
    return e;
  };

  const handleAddressChange = (e) => {
    setAddress((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: "" }));
  };

  const applyOffer = (offer) => {
    if (cartTotal < offer.minOrder) return;
    setAppliedOffer(offer);
    setShowOffers(false);
    setManualError("");
  };

  const removeOffer = () => {
    setAppliedOffer(null);
    setManualCode("");
  };

  const applyManualCode = () => {
    const found = OFFERS.find(
      (o) => o.code.toUpperCase() === manualCode.trim().toUpperCase()
    );
    if (!found) { setManualError("Invalid coupon code."); return; }
    if (cartTotal < found.minOrder) {
      setManualError(`Min order Rs. ${found.minOrder.toLocaleString()} required.`);
      return;
    }
    setAppliedOffer(found);
    setManualError("");
    setShowOffers(false);
  };

  const handlePlaceOrder = () => {
    setPlacing(true);
    setTimeout(() => {
      const order = placeOrder({
        items: cartItems,
        total: grandTotal,
        paymentMethod,
        buyer: user,
        address,
        offer: appliedOffer || null,
        discount: discountAmt,
      });
      clearCart();
      navigate(`/buyer/order-confirmation/${order.id}`);
    }, 1800);
  };

  if (cartItems.length === 0 && !placing) {
    return (
      <div className="co-empty-page">
        <Navbar searchBar={null} />
        <div className="co-empty">
          <h2>Your cart is empty</h2>
          <p>Add some products before checking out.</p>
          <Link to="/buyer" className="co-empty-btn">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      <Navbar searchBar={null} />

      <div className="co-container">

        {/* Header */}
        <div className="co-header">
          <Link to="/buyer/cart" className="co-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Cart
          </Link>
          <h1 className="co-title">Checkout</h1>
          <div className="co-secure">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secure Checkout
          </div>
        </div>

        {/* Step indicators */}
        <div className="co-steps">
          {["Delivery", "Payment", "Review"].map((label, i) => (
            <div key={i} className="co-step-wrap">
              <div className={`co-step ${step === i+1 ? "co-step--active" : step > i+1 ? "co-step--done" : ""}`}>
                <div className="co-step-num">
                  {step > i+1 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : i+1}
                </div>
                <span className="co-step-label">{label}</span>
              </div>
              {i < 2 && <div className={`co-step-line ${step > i+1 ? "co-step-line--done" : ""}`} />}
            </div>
          ))}
        </div>

        <div className="co-body">
          <div className="co-main">

            {/* ── STEP 1: Address ── */}
            {step === 1 && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <span className="co-section-num">1</span>
                  Delivery Address
                </h2>

                <div className="co-form">
                  <div className="co-row">
                    <div className="co-field">
                      <label>Full Name <span className="co-req">*</span></label>
                      <input
                        name="fullName"
                        value={address.fullName}
                        onChange={handleAddressChange}
                        placeholder="Aarav Sharma"
                      />
                      {errors.fullName && <span className="co-field-err">{errors.fullName}</span>}
                    </div>
                    <div className="co-field">
                      <label>Phone Number <span className="co-req">*</span></label>
                      <input
                        name="phone"
                        value={address.phone}
                        onChange={handleAddressChange}
                        placeholder="98XXXXXXXX"
                        maxLength={10}
                      />
                      {errors.phone && <span className="co-field-err">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="co-row">
                    <div className="co-field">
                      <label>Province <span className="co-req">*</span></label>
                      <select name="province" value={address.province} onChange={handleAddressChange}>
                        {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="co-field">
                      <label>City / District <span className="co-req">*</span></label>
                      <input
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        placeholder="Kathmandu"
                      />
                      {errors.city && <span className="co-field-err">{errors.city}</span>}
                    </div>
                  </div>

                  <div className="co-field">
                    <label>Area / Street <span className="co-req">*</span></label>
                    <input
                      name="area"
                      value={address.area}
                      onChange={handleAddressChange}
                      placeholder="Thamel, Ward No. 26"
                    />
                    {errors.area && <span className="co-field-err">{errors.area}</span>}
                  </div>

                  <div className="co-field">
                    <label>Landmark <span className="co-optional">(optional)</span></label>
                    <input
                      name="landmark"
                      value={address.landmark}
                      onChange={handleAddressChange}
                      placeholder="Near Thamel Chowk, opposite to..."
                    />
                  </div>

                  {/* ── OFFERS SECTION ── */}
                  <div className="co-offers-section">
                    <div className="co-offers-header">
                      <div className="co-offers-title-wrap">
                        <div>
                          <p className="co-offers-title">Offers & Discounts</p>
                          <p className="co-offers-sub">
                            {appliedOffer
                              ? `"${appliedOffer.code}" applied — saving Rs. ${discountAmt.toLocaleString()}`
                              : `${OFFERS.length} offers available for you`}
                          </p>
                        </div>
                      </div>
                      {appliedOffer ? (
                        <button className="co-offers-remove" onClick={removeOffer}>
                          Remove offer ×
                        </button>
                      ) : (
                        <button
                          className="co-offers-toggle"
                          onClick={() => setShowOffers(!showOffers)}
                        >
                          {showOffers ? "Hide offers ↑" : "View all offers ↓"}
                        </button>
                      )}
                    </div>

                    {/* Applied offer pill */}
                    {appliedOffer && (
                      <div className="co-applied-pill">
                        <span className="co-applied-emoji">{appliedOffer.emoji}</span>
                        <div className="co-applied-info">
                          <strong>{appliedOffer.code}</strong>
                          <span>{appliedOffer.desc}</span>
                        </div>
                        <span className="co-applied-saving">
                          − Rs. {discountAmt.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Offer cards */}
                    {showOffers && !appliedOffer && (
                      <div className="co-offers-list">
                        {/* Manual code input */}
                        <div className="co-manual-code">
                          <input
                            type="text"
                            placeholder="Have a code? Enter here"
                            value={manualCode}
                            onChange={(e) => {
                              setManualCode(e.target.value.toUpperCase());
                              setManualError("");
                            }}
                            className="co-manual-input"
                          />
                          <button className="co-manual-btn" onClick={applyManualCode}>
                            Apply
                          </button>
                        </div>
                        {manualError && (
                          <p className="co-manual-error">{manualError}</p>
                        )}

                        <p className="co-or-divider"><span>or choose an offer</span></p>

                        {/* Offer cards */}
                        <div className="co-offer-cards">
                          {OFFERS.map((offer) => (
                            <OfferCard
                              key={offer.id}
                              offer={offer}
                              isApplied={appliedOffer?.id === offer.id}
                              cartTotal={cartTotal}
                              onApply={applyOffer}
                              onRemove={removeOffer}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="co-next-btn"
                    onClick={() => {
                      const errs = validateAddress();
                      if (Object.keys(errs).length) { setErrors(errs); return; }
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Continue to Payment
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Payment ── */}
            {step === 2 && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <span className="co-section-num">2</span>
                  Payment Method
                </h2>

                <div className="co-payment-options">
                  {[
                    {
                      id: "cod",
                      label: "Cash on Delivery",
                      sub: "Pay when your order arrives at your door",
                    },
                    {
                      id: "esewa",
                      label: "eSewa",
                      sub: "Fast & secure digital wallet payment",
                    },
                    {
                      id: "khalti",
                      label: "Khalti",
                      sub: "Pay via Khalti digital wallet",
                    },
                    {
                      id: "bank",
                      label: "Bank Transfer",
                      sub: "Direct transfer to our bank account",
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`co-payment-option ${paymentMethod === method.id ? "co-payment-option--active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <span className="co-payment-emoji">{method.emoji}</span>
                      <div className="co-payment-info">
                        <p className="co-payment-label">{method.label}</p>
                        <p className="co-payment-sub">{method.sub}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <div className="co-payment-check">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                      )}
                    </label>
                  ))}
                </div>

                {(paymentMethod === "esewa" || paymentMethod === "khalti") && (
                  <div className="co-digital-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    This is a demo. In production this connects to the real{" "}
                    {paymentMethod === "esewa" ? "eSewa" : "Khalti"} API.
                  </div>
                )}

                <div className="co-nav-btns">
                  <button className="co-back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="co-next-btn" onClick={() => { setStep(3); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                    Review Order →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <div className="co-section">
                <h2 className="co-section-title">
                  <span className="co-section-num">3</span>
                  Review & Place Order
                </h2>

                {/* Address review */}
                <div className="co-review-block">
                  <div className="co-review-block-header">
                    <div className="co-review-block-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Delivering to
                    </div>
                    <button className="co-review-edit" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <p className="co-review-name">{address.fullName} · {address.phone}</p>
                  <p className="co-review-addr">
                    {address.area}, {address.city}, {address.province}
                    {address.landmark && ` · ${address.landmark}`}
                  </p>
                </div>

                {/* Payment review */}
                <div className="co-review-block">
                  <div className="co-review-block-header">
                    <div className="co-review-block-label">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Payment
                    </div>
                    <button className="co-review-edit" onClick={() => setStep(2)}>Edit</button>
                  </div>
                  <p className="co-review-payment">
                    {paymentMethod === "cod"    ? " Cash on Delivery" :
                     paymentMethod === "esewa"  ? " eSewa" :
                     paymentMethod === "khalti" ? " Khalti" : " Bank Transfer"}
                  </p>
                </div>

                {/* Applied offer */}
                {appliedOffer && (
                  <div className="co-review-block co-review-block--offer">
                    <div className="co-review-block-label">
                       Offer Applied
                    </div>
                    <p className="co-review-offer">
                      {appliedOffer.code} — {appliedOffer.desc}
                      <strong> (saving Rs. {discountAmt.toLocaleString()})</strong>
                    </p>
                  </div>
                )}

                {/* Items */}
                <div className="co-review-block">
                  <div className="co-review-block-label" style={{ marginBottom: "10px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                    </svg>
                    {cartItems.length} Item{cartItems.length > 1 ? "s" : ""}
                  </div>
                  <div className="co-review-items">
                    {cartItems.map((item) => (
                      <div key={item.id} className="co-review-item">
                        <img src={item.image} alt={item.name} className="co-review-item-img" />
                        <div className="co-review-item-info">
                          <p className="co-review-item-name">{item.name}</p>
                          <p className="co-review-item-seller">{item.seller} · ×{item.quantity}</p>
                        </div>
                        <p className="co-review-item-price">
                          Rs. {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="co-nav-btns">
                  <button className="co-back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className={`co-place-btn ${placing ? "co-place-btn--placing" : ""}`}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? (
                      <>
                        <span className="co-spinner" />
                        Processing your order…
                      </>
                    ) : (
                      <>
                        Place Order · Rs. {grandTotal.toLocaleString()}
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY SIDEBAR ── */}
          <div className="co-sidebar">
            <div className="co-summary">
              <h3 className="co-summary-title">Order Summary</h3>

              <div className="co-summary-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="co-summary-item">
                    <div className="co-summary-item-img-wrap">
                      <img src={item.image} alt={item.name} className="co-summary-item-img" />
                      <span className="co-summary-item-qty">{item.quantity}</span>
                    </div>
                    <div className="co-summary-item-info">
                      <p>{item.name.length > 22 ? item.name.slice(0,22)+"…" : item.name}</p>
                      <p className="co-summary-item-seller">{item.seller}</p>
                    </div>
                    <p className="co-summary-item-price">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="co-summary-divider" />

              <div className="co-summary-rows">
                <div className="co-summary-row">
                  <span>Subtotal</span>
                  <span>Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <div className="co-summary-row">
                  <span>Delivery</span>
                  <span className={finalDelivery === 0 ? "co-free" : ""}>
                    {finalDelivery === 0 ? "FREE" : `Rs. ${finalDelivery}`}
                  </span>
                </div>
                {discountAmt > 0 && (
                  <div className="co-summary-row co-summary-row--discount">
                    <span>
                      Discount
                      {appliedOffer && <span className="co-coupon-tag">{appliedOffer.code}</span>}
                    </span>
                    <span>− Rs. {discountAmt.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="co-summary-divider" />

              <div className="co-summary-total">
                <span>Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>

              {cartTotal < 2000 && !freeShip && (
                <div className="co-free-ship-hint">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  Add Rs. {(2000 - cartTotal).toLocaleString()} more for free delivery
                </div>
              )}

              {freeShip && (
                <div className="co-free-ship-hint co-free-ship-hint--active">
                  🎉 Free delivery applied with your offer!
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="co-trust-badges">
              {[
                {  text: "SSL Encrypted" },
                {  text: "7-Day Returns" },
                {  text: "Verified Sellers" },
              ].map((b, i) => (
                <div key={i} className="co-trust-badge">
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}