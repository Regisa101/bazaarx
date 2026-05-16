import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../../cart/hooks/useCart";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import { StarRating } from "../../products/components/ProductCard";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "./ProductDetails.css";

const LOW_STOCK_THRESHOLD = 10;

// ── Interactive star picker ───────────────────────────────────
function InteractiveStars({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="interactive-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button"
          className={`istar ${active >= star ? "istar--on" : ""}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >★</button>
      ))}
      <span className="istar-label">{labels[active] || "Select rating"}</span>
    </div>
  );
}

export default function ProductDetails() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addToCart, cartItems }              = useCart();
  const { products, addReview, removeReview } = useProducts();
  const { user }                              = useAuth();

  // ── All hooks must come before any conditional return ────────
  const [added,              setAdded]              = useState(false);
  const [selectedVariant,    setSelectedVariant]    = useState(null);
  const [variantError,       setVariantError]       = useState(false);
  const [reviewRating,       setReviewRating]       = useState(0);
  const [reviewComment,      setReviewComment]      = useState("");
  const [reviewImagePreview, setReviewImagePreview] = useState("");
  const [reviewSubmitted,    setReviewSubmitted]    = useState(false);
  const reviewFileRef = useRef(null);

  // ✅ FIX: Auto-select first variant as default when product loads.
  //    This runs BEFORE the early return so hooks are called every render.
  useEffect(() => {
    const p = products.find((pp) => pp.id === parseInt(id));
    if (p && Array.isArray(p.variants) && p.variants.length > 0) {
      setSelectedVariant(0); // ← first variant is default
    } else {
      setSelectedVariant(null); // ← no variants = no selection needed
    }
    setVariantError(false); // reset error when product changes
    setAdded(false);
  }, [id]); // re-runs when navigating to a different product

  // ── Derive product ────────────────────────────────────────────
  const product = products.find((p) => p.id === parseInt(id));

  if (!product) {
    return (
      <div className="pd-not-found">
        <Navbar searchBar={null} />
        <p>Product not found.</p>
        <Link to="/buyer">← Back to shop</Link>
      </div>
    );
  }

  // ── Variant helpers ───────────────────────────────────────────
  const hasVariants   = Array.isArray(product.variants) && product.variants.length > 0;
  const activeVariant = hasVariants && selectedVariant !== null
    ? product.variants[selectedVariant]
    : null;

  // Final price: base price + variant price adjustment
  const displayPrice = activeVariant
    ? product.price + (parseFloat(activeVariant.priceAdjust) || 0)
    : product.price;

  // Unique cart key — variant products get their own cart slot
  const cartKey   = activeVariant
    ? `${product.id}__${activeVariant.label}`
    : String(product.id);
  const inCart    = cartItems.find((i) => i.cartId === cartKey);
  const inCartQty = inCart?.quantity || 0;
  const canAddMore = inCartQty < product.stock;

  // ── Reviews ───────────────────────────────────────────────────
  const allReviews  = Array.isArray(product.reviews) ? product.reviews : [];
  const avgRating   = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  const reviewCount = allReviews.length;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    pct:   reviewCount > 0
      ? Math.round(allReviews.filter((r) => r.rating === star).length / reviewCount * 100)
      : 0,
  }));

  const suggested = products
    .filter((p) => p.category === product.category && p.id !== product.id && p.stock > 0)
    .slice(0, 4);

  const canModerate = user && (
    user.role === "admin" ||
    (user.role === "seller" && user.name === product.seller)
  );

  // ── Cart handlers ─────────────────────────────────────────────
  const doAdd = () => {
    // ✅ FIX: if product has variants but none selected (shouldn't happen
    //    since useEffect auto-selects, but just in case), auto-pick first.
    let variantIdx = selectedVariant;
    if (hasVariants && variantIdx === null) {
      variantIdx = 0;
      setSelectedVariant(0);
    }

    const variant     = hasVariants ? product.variants[variantIdx] : null;
    const finalPrice  = variant
      ? product.price + (parseFloat(variant.priceAdjust) || 0)
      : product.price;

    addToCart(
      product,
      variant ? variant.label : null,
      variant ? `${product.variantType}: ${variant.label}` : null,
      finalPrice,
    );
  };

  const handleAddToCart = () => {
    if (product.stock === 0 || !canAddMore) return;
    doAdd();
    setAdded(true);
    setVariantError(false);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (product.stock === 0 || !canAddMore) return;
    doAdd();
    navigate("/buyer/cart");
  };

  // ── Review handlers ───────────────────────────────────────────
  const handleReviewImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setReviewImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!user || reviewRating === 0 || !reviewComment.trim()) return;
    addReview(product.id, {
      id:      Date.now(),
      user:    user.name,
      avatar:  user.name.charAt(0).toUpperCase(),
      rating:  reviewRating,
      date:    new Date().toISOString().split("T")[0],
      comment: reviewComment,
      image:   reviewImagePreview || null,
      userId:  user.id,
    });
    setReviewRating(0);
    setReviewComment("");
    setReviewImagePreview("");
    if (reviewFileRef.current) reviewFileRef.current.value = "";
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  // ── Navbar search (redirects to home) ────────────────────────
  const navSearch = (
    <form
      style={{ display: "flex", alignItems: "center", background: "#fff", width: "100%" }}
      onSubmit={(e) => { e.preventDefault(); navigate("/buyer"); }}
    >
      <input
        type="text"
        placeholder="Search products, brands or sellers…"
        onClick={() => navigate("/buyer")}
        readOnly
        style={{
          flex: 1, height: "42px", padding: "0 14px",
          border: "none", outline: "none",
          fontFamily: "Poppins, sans-serif", fontSize: "0.875rem",
          color: "#111", background: "#fff", cursor: "pointer",
        }}
      />
      <button type="submit" className="nav-search-btn">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>
  );

  return (
    <div className="pd-page">
      <Navbar searchBar={navSearch} />

      <div className="pd-container">

        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <Link to="/buyer">Home</Link>
          <span>›</span>
          <Link to="/buyer">{product.category}</Link>
          <span>›</span>
          <span>{product.name}</span>
        </nav>

        {/* ══ Main product section ══ */}
        <div className="pd-main">

          {/* Left: Image */}
          <div className="pd-image-wrap">
            <img src={product.image} alt={product.name} className="pd-image" />
            {product.stock === 0 && (
              <div className="pd-out-of-stock-overlay">OUT OF STOCK</div>
            )}
            {product.stock > 0 && product.stock < 5 && (
              <div className="pd-stock-badge">Only {product.stock} left!</div>
            )}
          </div>

          {/* Right: Info */}
          <div className="pd-info">
            <p className="pd-seller">Sold by <strong>{product.seller}</strong></p>
            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-rating-row">
              <StarRating rating={avgRating} size="md" />
              <span className="pd-rating-num">
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
              </span>
              <a href="#reviews" className="pd-rating-link">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </a>
            </div>

            <div className="pd-divider" />

            {/* Price — updates when variant changes */}
            <div className="pd-price-row">
              <span className="pd-price">Rs. {displayPrice.toLocaleString()}</span>
              {product.comparePrice && (
                <>
                  <span className="pd-price-original">
                    Rs. {product.comparePrice.toLocaleString()}
                  </span>
                  <span className="pd-discount-badge">
                    -{Math.round((1 - displayPrice / product.comparePrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            <p className="pd-desc">{product.description}</p>

            {/* Tags */}
            {Array.isArray(product.tags) && product.tags.length > 0 && (
              <div className="pd-tags">
                {product.tags.map((tag) => (
                  <span key={tag} className="pd-tag">{tag}</span>
                ))}
              </div>
            )}

            {/* ── Variant Selector ── */}
            {hasVariants && (
              <div className="pd-variants">
                <p className="pd-variant-label">
                  {product.variantType}:
                  {selectedVariant !== null && (
                    <strong> {product.variants[selectedVariant].label}</strong>
                  )}
                </p>
                <div className="pd-variant-options">
                  {product.variants.map((v, i) => {
                    const finalPrice = product.price + (parseFloat(v.priceAdjust) || 0);
                    const hasDiff    = parseFloat(v.priceAdjust) !== 0;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`pd-variant-btn ${selectedVariant === i ? "pd-variant-btn--active" : ""}`}
                        onClick={() => {
                          setSelectedVariant(i);
                          setVariantError(false);
                        }}
                      >
                        {v.label}
                        {hasDiff && (
                          <span className="pd-variant-price-tag">
                            {parseFloat(v.priceAdjust) > 0 ? "+" : "−"}
                            Rs. {Math.abs(parseFloat(v.priceAdjust)).toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {variantError && (
                  <p className="pd-variant-error">
                    ⚠ Please select a {product.variantType} before adding to cart
                  </p>
                )}
              </div>
            )}

            {/* Stock status */}
            <div className="pd-stock-info">
              {product.stock === 0 ? (
                <span className="out-of-stock">✗ Out of Stock — check back later</span>
              ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                <span className="low-stock">⚠ Only {product.stock} left in stock!</span>
              ) : (
                <span className="in-stock">✓ In Stock</span>
              )}
              {inCartQty > 0 && (
                <span className="pd-in-cart-note">
                  · {inCartQty} already in your cart
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="pd-actions">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || !canAddMore}
                className={`pd-btn-add
                  ${added ? "pd-btn-added" : ""}
                  ${(product.stock === 0 || !canAddMore) ? "pd-btn-disabled" : ""}
                `}
              >
                {product.stock === 0  ? "Out of Stock"
                  : !canAddMore       ? `Max in cart (${product.stock})`
                  : added             ? "✓ Added to Cart"
                  : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0 || !canAddMore}
                className={`pd-btn-cart ${(product.stock === 0 || !canAddMore) ? "pd-btn-disabled" : ""}`}
              >
                Buy Now
              </button>
            </div>

            {/* Delivery info */}
            <div className="pd-delivery">
              <div className="pd-delivery-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <span>Free delivery across Nepal on orders above Rs. 2,000</span>
              </div>
              <div className="pd-delivery-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>7-day easy return policy</span>
              </div>
              <div className="pd-delivery-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>Secure checkout — eSewa, Khalti, COD</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ Suggested Products ══ */}
        {suggested.length > 0 && (
          <div className="pd-suggested">
            <h2 className="pd-section-title">You May Also Like</h2>
            <div className="pd-suggested-grid">
              {suggested.map((p) => {
                const avg = Array.isArray(p.reviews) && p.reviews.length > 0
                  ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length
                  : 0;
                return (
                  <Link to={`/buyer/product/${p.id}`} key={p.id} className="pd-suggested-card">
                    <div className="pd-suggested-img-wrap">
                      <img src={p.image} alt={p.name} className="pd-suggested-img" />
                    </div>
                    <div className="pd-suggested-info">
                      <p className="pd-suggested-seller">{p.seller}</p>
                      <p className="pd-suggested-name">{p.name}</p>
                      <div className="pd-suggested-rating-row">
                        <StarRating rating={avg} size="sm" />
                        <span className="pd-suggested-avg">
                          {avg > 0 ? avg.toFixed(1) : "No ratings"}
                        </span>
                      </div>
                      <p className="pd-suggested-price">Rs. {p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ Reviews ══ */}
        <div className="pd-reviews" id="reviews">
          <h2 className="pd-section-title">Customer Reviews</h2>

          <div className="pd-reviews-summary">
            <div className="pd-reviews-left">
              <div className="pd-big-rating">
                {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
              </div>
              <StarRating rating={avgRating} size="lg" />
              <p className="pd-reviews-count">
                {reviewCount > 0 ? `${reviewCount} reviews` : "No reviews yet"}
              </p>
            </div>
            <div className="pd-reviews-dist">
              {dist.map((d) => (
                <div key={d.star} className="pd-dist-row">
                  <span className="pd-dist-label">{d.star} ★</span>
                  <div className="pd-dist-bar-wrap">
                    <div className="pd-dist-bar" style={{ width: `${d.pct}%` }} />
                  </div>
                  <span className="pd-dist-count">{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {canModerate && reviewCount > 0 && (
            <div className="pd-moderation-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              You can remove inappropriate reviews as {user.role}.
            </div>
          )}

          <div className="pd-review-list">
            {reviewCount === 0 && (
              <p className="pd-no-reviews">No reviews yet. Be the first to review!</p>
            )}
            {allReviews.map((r) => (
              <div key={r.id} className="pd-review-card">
                <div className="pd-review-header">
                  <div className="pd-review-avatar">{r.avatar}</div>
                  <div className="pd-review-meta">
                    <p className="pd-review-user">{r.user}</p>
                    <div className="pd-review-sub">
                      <StarRating rating={r.rating} size="sm" />
                      <span className="pd-review-date">{r.date}</span>
                    </div>
                  </div>
                  {canModerate && (
                    <button
                      className="pd-review-remove"
                      onClick={() => removeReview(product.id, r.id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                      </svg>
                      Remove
                    </button>
                  )}
                </div>
                <p className="pd-review-comment">{r.comment}</p>
                {r.image && (
                  <div className="pd-review-img-wrap">
                    <img src={r.image} alt="Review" className="pd-review-img" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pd-write-review">
            <h3 className="pd-write-title">Write a Review</h3>
            {!user && (
              <div className="pd-login-prompt">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <p>You must be logged in to write a review.</p>
                <Link to="/login" className="pd-login-btn">Login to Review</Link>
              </div>
            )}

            {user && (
              <>
                {reviewSubmitted && (
                  <div className="pd-review-success">
                    ✓ Thank you! Your review has been posted.
                  </div>
                )}
                <form className="pd-review-form" onSubmit={handleReviewSubmit}>
                  <div className="pd-review-field">
                    <label>Your Rating *</label>
                    <InteractiveStars value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <div className="pd-review-field">
                    <label>Your Review *</label>
                    <textarea
                      placeholder="Share your experience with this product…"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="pd-review-field">
                    <label>
                      Add Photo <span className="pd-review-optional">(optional)</span>
                    </label>
                    <input
                      ref={reviewFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleReviewImageChange}
                    />
                    {!reviewImagePreview ? (
                      <button
                        type="button"
                        className="pd-review-upload-btn"
                        onClick={() => reviewFileRef.current?.click()}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                        Choose Photo from Gallery
                      </button>
                    ) : (
                      <div className="pd-review-img-preview-box">
                        <img src={reviewImagePreview} alt="Your photo" />
                        <button
                          type="button"
                          className="pd-review-img-remove"
                          onClick={() => {
                            setReviewImagePreview("");
                            if (reviewFileRef.current) reviewFileRef.current.value = "";
                          }}
                        >
                          × Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="pd-review-submit"
                    disabled={reviewRating === 0 || !reviewComment.trim()}
                  >
                    Post Review
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}