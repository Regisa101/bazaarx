import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductCard from "../../products/components/ProductCard";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import "./BuyerHome.css";

// ── Constants ──────────────────────────────────────────────────
const CATEGORIES = [
  "All","Accessories","Bags","Home","Clothing","Kitchen",
  "Beauty","Jewellery","Watches","Stationery","Footwear",
  "Sports","Books","Electronics","Food & Drink","Pets",
  "Baby","Art & Craft","Plants","Toys & Kids","Wellness","Furniture",
];

const PRODUCTS_PER_PAGE = 16;

const SLIDES = [
  {
    tag: "Flash Sale · Ends Tonight",
    title: "Endless Savings.\nLimited Time.",
    sub: "Exclusive deals from independent Nepali sellers.",
    cta: "Shop the Sale",
    bg: "#f0a500",
    textDark: true,
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&q=85",
  },
  {
    tag: "New Arrivals",
    title: "Fresh Styles\nJust Dropped.",
    sub: "Discover new products from top-rated independent sellers.",
    cta: "Explore Now",
    bg: "#111",
    textDark: false,
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&q=85",
  },
  {
    tag: "Home & Living",
    title: "Transform Your\nLiving Space.",
    sub: "Curated home essentials. Free delivery on orders over Rs. 2,000.",
    cta: "Shop Home",
    bg: "#1a3a2a",
    textDark: false,
    img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&q=85",
  },
];

const COLLECTIONS = [
  {
    title: "Home & Living",
    sub: "Furniture, decor & more",
    filter: "Home",
    cover: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
    items: [
      { label: "Sofa",        img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=70" },
      { label: "Lighting",    img: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200&q=70" },
      { label: "Plants",      img: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=200&q=70" },
      { label: "Kitchenware", img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=70" },
    ],
  },
  {
    title: "Electronics",
    sub: "Gadgets, phones & tech",
    filter: "Electronics",
    cover: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80",
    items: [
      { label: "Phones",    img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&q=70" },
      { label: "Laptops",   img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&q=70" },
      { label: "Headphones",img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=70" },
      { label: "Cameras",   img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&q=70" },
    ],
  },
  {
    title: "Fashion",
    sub: "Clothing, shoes & accessories",
    filter: "Clothing",
    cover: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80",
    items: [
      { label: "Jackets",     img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=70" },
      { label: "Footwear",    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=70" },
      { label: "Bags",        img: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&q=70" },
      { label: "Accessories", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&q=70" },
    ],
  },
];

// ── Flash sale countdown timer ────────────────────────────────
function useTimer(initial) {
  const [t, setT] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setT((p) => (p <= 0 ? initial : p - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return {
    h: String(Math.floor(t / 3600)).padStart(2, "0"),
    m: String(Math.floor((t % 3600) / 60)).padStart(2, "0"),
    s: String(t % 60).padStart(2, "0"),
  };
}

// ── Search suggestion input ───────────────────────────────────
function SearchBar({ products, onSearch }) {
  const [val, setVal]           = useState("");
  const [cat, setCat]           = useState("All");
  const [suggestions, setSugg]  = useState([]);
  const [open, setOpen]         = useState(false);
  const wrapRef                 = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (v) => {
    setVal(v);
    if (!v.trim()) { setSugg([]); setOpen(false); return; }
    const q   = v.toLowerCase();
    const raw = products.flatMap((p) => [p.name, p.category]);
    const res = [...new Set(raw.filter((s) => s.toLowerCase().includes(q)))].slice(0, 8);
    setSugg(res);
    setOpen(res.length > 0);
  };

  const submit = (e) => {
    e?.preventDefault();
    onSearch(val, cat);
    setOpen(false);
  };

  const pick = (s) => {
    setVal(s);
    onSearch(s, cat);
    setOpen(false);
  };

  return (
    <form className="bh-search" onSubmit={submit} ref={wrapRef}>
      <select className="bh-search-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <div className="bh-search-input-wrap">
        <input
          className="bh-search-input"
          placeholder="Search products, sellers…"
          value={val}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          autoComplete="off"
        />
        {open && (
          <div className="bh-suggestions">
            {suggestions.map((s, i) => (
              <div key={i} className="bh-suggestion" onMouseDown={() => pick(s)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="submit" className="bh-search-btn">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </form>
  );
}

// ── Main component ────────────────────────────────────────────
export default function BuyerHome() {
  const { products }                          = useProducts();
  const [slide, setSlide]                     = useState(0);
  const [activeCat, setActiveCat]             = useState("All");
  const [search, setSearch]                   = useState("");
  const [visibleCount, setVisibleCount]       = useState(PRODUCTS_PER_PAGE);
  const timerRef                              = useRef(null);
  const productsRef                           = useRef(null);
  const { h, m, s }                           = useTimer(3 * 3600 + 47 * 60 + 22);

  // Auto-slide
  const startAuto = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setSlide((p) => (p + 1) % SLIDES.length), 5000
    );
  };
  useEffect(() => { startAuto(); return () => clearInterval(timerRef.current); }, []);
  useEffect(() => { setVisibleCount(PRODUCTS_PER_PAGE); }, [activeCat, search]);

  const goSlide = (i) => { setSlide(i); startAuto(); };

  const handleSearch = (q, cat) => {
    setSearch(q);
    setActiveCat(cat);
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategoryClick = (filter) => {
    setActiveCat(filter);
    setSearch("");
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Filtered products
  const filtered = products.filter((p) => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCat === "All" || p.category === activeCat;
    return matchSearch && matchCat;
  });
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // ── Flash sale: only products the seller opted into ──────────
  // Uses flashPrice (pre-calculated discounted price) set by the seller in AddProduct.
  // Falls back to comparePrice as the "original" crossed-out price, or estimates +35% if none set.
  const flashProducts = products
    .filter((p) => p.inFlashSale === true && p.stock > 0)
    .map((p) => ({
      ...p,
      displayFlashPrice: p.flashPrice ?? p.price,
      originalPrice:     p.comparePrice ?? Math.round(p.price * 1.35),
    }));

  const searchBar = (
    <SearchBar products={products} onSearch={handleSearch} />
  );

  const cur = SLIDES[slide];

  return (
    <div className="bh">
      <Navbar searchBar={searchBar} />

      {/* ══════════════════════════════════════
          HERO SLIDER
      ══════════════════════════════════════ */}
      <section className="bh-hero" style={{ background: cur.bg }}>
        <div className="bh-hero-text">
          <span className="bh-hero-tag" style={{ color: cur.textDark ? "#111" : "#f0a500" }}>
            {cur.tag}
          </span>
          <h1 className="bh-hero-title" style={{ color: cur.textDark ? "#111" : "#fff" }}>
            {cur.title.split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
          </h1>
          <p className="bh-hero-sub" style={{ color: cur.textDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.65)" }}>
            {cur.sub}
          </p>
          <button
            className="bh-hero-cta"
            style={cur.textDark
              ? { background: "#111", color: "#fff" }
              : { background: "#f0a500", color: "#111" }}
            onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            {cur.cta}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>

        <div className="bh-hero-img-wrap">
          <img src={cur.img} alt={cur.tag} className="bh-hero-img" />
        </div>

        <div className="bh-hero-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`bh-dot ${i === slide ? "bh-dot--active" : ""}`}
              onClick={() => goSlide(i)}
            />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FLASH SALE
          Only shown when at least one seller has opted in
      ══════════════════════════════════════ */}
      {flashProducts.length > 0 && (
        <section className="bh-flash">
          <div className="bh-inner">
            <div className="bh-flash-header">
              <div className="bh-flash-left">
                <h2 className="bh-section-title">Flash Sale</h2>
                <div className="bh-timer">
                  <span className="bh-timer-label">Ends in</span>
                  <span className="bh-timer-block">{h}</span>
                  <span className="bh-timer-sep">:</span>
                  <span className="bh-timer-block">{m}</span>
                  <span className="bh-timer-sep">:</span>
                  <span className="bh-timer-block">{s}</span>
                </div>
              </div>
              <button
                className="bh-view-all"
                onClick={() => {
                  setActiveCat("All");
                  setSearch("");
                  productsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                View All →
              </button>
            </div>

            <div className="bh-flash-scroll">
              {flashProducts.map((p) => (
                <Link to={`/buyer/product/${p.id}`} key={p.id} className="bh-flash-card">
                  <div className="bh-flash-img-wrap">
                    <img src={p.image} alt={p.name} className="bh-flash-img" />
                    {/* Show discount % badge */}
                    <span className="bh-flash-badge">
                      -{p.flashDiscount}% OFF
                    </span>
                    {p.stock === 0 && <div className="bh-flash-oos">Sold Out</div>}
                  </div>
                  <div className="bh-flash-info">
                    <p className="bh-flash-name">
                      {p.name.length > 28 ? p.name.slice(0, 28) + "…" : p.name}
                    </p>
                    <div className="bh-flash-prices">
                      {/* discounted flash price */}
                      <span className="bh-flash-price">
                        Rs. {p.displayFlashPrice.toLocaleString()}
                      </span>
                      {/* original price crossed out */}
                      <span className="bh-flash-original">
                        Rs. {p.originalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          ALL PRODUCTS
      ══════════════════════════════════════ */}
      <section className="bh-products" ref={productsRef}>
        <div className="bh-inner">

          <div className="bh-products-header">
            <div>
              <h2 className="bh-section-title">
                {activeCat === "All" ? "All Products" : activeCat}
              </h2>
              {search && (
                <p className="bh-search-label">
                  Results for "<strong>{search}</strong>"
                </p>
              )}
            </div>
            <span className="bh-count">{filtered.length} items</span>
          </div>

          {/* Category filter */}
          <div className="bh-cat-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`bh-cat-tab ${activeCat === cat && !search ? "bh-cat-tab--active" : ""}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {visible.length > 0 ? (
            <>
              <div className="bh-product-grid">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {hasMore && (
                <div className="bh-load-more">
                  <button
                    className="bh-load-btn"
                    onClick={() => setVisibleCount((v) => v + PRODUCTS_PER_PAGE)}
                  >
                    Load More
                  </button>
                  <p className="bh-load-hint">
                    Showing {visible.length} of {filtered.length}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bh-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <p>No products found{search ? ` for "${search}"` : ""}.</p>
              {(search || activeCat !== "All") && (
                <button className="bh-view-all" onClick={() => { setSearch(""); setActiveCat("All"); }}>
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}