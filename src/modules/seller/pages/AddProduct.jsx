import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Seller.css";
import "./AddProduct.css";

const CATEGORIES = [
  "Accessories","Bags","Home","Clothing","Kitchen","Beauty","Jewellery",
  "Watches","Stationery","Footwear","Sports","Books","Electronics",
  "Food & Drink","Pets","Baby","Art & Craft","Plants","Toys & Kids","Wellness","Furniture",
];

// Which dimension names should default to price-affecting when quick-added
const PRICE_AFFECTING_DEFAULTS = ["Volume (ml)", "Weight (g)", "Storage", "RAM"];

const SUGGESTED_DIMENSIONS = {
  Clothing:       ["Size", "Color"],
  Footwear:       ["Size", "Color"],
  Electronics:    ["Storage", "Color", "RAM"],
  Beauty:         ["Volume (ml)", "Shade"],
  "Food & Drink": ["Weight (g)", "Flavour"],
  Jewellery:      ["Material", "Size"],
  Bags:           ["Color", "Size"],
  Accessories:    ["Color", "Size"],
  default:        ["Color", "Size", "Material"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES    = 6;
const DESC_MAX      = 600;

const EMPTY_FORM = {
  name:"", price:"", comparePrice:"", category:"Accessories",
  stock:"", description:"", tags:"",
};

export default function AddProduct() {
  const { addProduct } = useProducts();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const fileInputRef   = useRef(null);

  const [submitted,  setSubmitted]  = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [errors,     setErrors]     = useState({});

  // ── Multi-image ──────────────────────────────────────────────
  const [images,      setImages]      = useState([]);
  const [activeThumb, setActiveThumb] = useState(0);
  const [urlInput,    setUrlInput]    = useState("");
  const [urlError,    setUrlError]    = useState("");
  const [fileError,   setFileError]   = useState("");

  // ── Flash sale ───────────────────────────────────────────────
  const [inFlashSale,   setInFlashSale]   = useState(false);
  const [flashDiscount, setFlashDiscount] = useState("10");

  // ── Multi-dimensional variants ───────────────────────────────
  // dimensions: [{
  //   name: string,
  //   priceAffecting: bool,       ← new: does this dim change price?
  //   options: string[],
  //   optionPrices: { [label]: number }  ← price adjustment per option
  // }]
  const [dimensions,   setDimensions]   = useState([]);
  const [newDimName,   setNewDimName]   = useState("");
  const [newDimOption, setNewDimOption] = useState({});  // { dimIdx: draftString }
  const [dimError,     setDimError]     = useState("");
  // track draft price inputs per (dimIdx, optLabel)
  const [draftPrices,  setDraftPrices]  = useState({});  // { "0__100ml": "500" }

  const suggested = SUGGESTED_DIMENSIONS[form.category] || SUGGESTED_DIMENSIONS.default;

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = "Product name is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
                                  e.price       = "Enter a valid price";
    if (form.comparePrice && Number(form.comparePrice) <= Number(form.price))
                                  e.comparePrice= "MRP must be greater than selling price";
    if (!form.stock || isNaN(form.stock) || Number(form.stock) < 0)
                                  e.stock       = "Enter a valid stock quantity";
    if (!form.description.trim()) e.description = "Description is required";
    if (images.length === 0)      e.images      = "At least one product image is required";
    if (inFlashSale && (!flashDiscount || isNaN(flashDiscount) ||
        Number(flashDiscount) <= 0 || Number(flashDiscount) >= 100))
                                  e.flashDiscount = "Enter a valid discount % (1–99)";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
    if (name === "category") setDimensions([]);
  };

  // ── Image helpers ────────────────────────────────────────────
  const addImageSrc = (src) => {
    if (images.length >= MAX_IMAGES) return;
    setImages(prev => { const next = [...prev, src]; setActiveThumb(next.length - 1); return next; });
    setErrors(p => ({ ...p, images:"" }));
  };
  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setActiveThumb(p => Math.min(p, Math.max(0, images.length - 2)));
  };
  const moveImage = (idx, dir) => {
    const swap = idx + dir;
    if (swap < 0 || swap >= images.length) return;
    setImages(prev => { const a = [...prev]; [a[idx], a[swap]] = [a[swap], a[idx]]; return a; });
    setActiveThumb(swap);
  };
  const handleAddUrl = () => {
    const t = urlInput.trim();
    if (!t)                          { setUrlError("Paste a URL first."); return; }
    if (!/^https?:\/\/.+/i.test(t)) { setUrlError("Must be a valid http/https URL."); return; }
    addImageSrc(t); setUrlInput(""); setUrlError("");
  };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    files.slice(0, remaining).forEach(file => {
      if (file.size > MAX_FILE_SIZE) { setFileError(`${file.name} too large.`); return; }
      const reader = new FileReader();
      reader.onload = ev => { addImageSrc(ev.target.result); setFileError(""); };
      reader.readAsDataURL(file);
    });
    if (files.length > remaining) setFileError(`Max ${MAX_IMAGES} images. Some skipped.`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Dimension helpers ─────────────────────────────────────────
  const addDimension = (name) => {
    const n = (name || newDimName).trim();
    if (!n) { setDimError("Enter a variant type name."); return; }
    if (dimensions.some(d => d.name.toLowerCase() === n.toLowerCase())) {
      setDimError(`"${n}" already added.`); return;
    }
    const priceAffecting = PRICE_AFFECTING_DEFAULTS.includes(n);
    setDimensions(prev => [...prev, { name: n, priceAffecting, options: [], optionPrices: {} }]);
    setNewDimName(""); setDimError("");
  };
  const removeDimension = (idx) =>
    setDimensions(prev => prev.filter((_, i) => i !== idx));

  const togglePriceAffecting = (dimIdx) => {
    setDimensions(prev => prev.map((d, i) =>
      i === dimIdx ? { ...d, priceAffecting: !d.priceAffecting } : d
    ));
  };

  const addOption = (dimIdx) => {
    const raw = (newDimOption[dimIdx] || "").trim();
    if (!raw) return;
    const opts = raw.split(",").map(s => s.trim()).filter(Boolean);
    setDimensions(prev => prev.map((d, i) => {
      if (i !== dimIdx) return d;
      const existing = d.options.map(o => o.toLowerCase());
      const toAdd    = opts.filter(o => !existing.includes(o.toLowerCase()));
      return { ...d, options: [...d.options, ...toAdd] };
    }));
    setNewDimOption(p => ({ ...p, [dimIdx]: "" }));
  };
  const removeOption = (dimIdx, optLabel) => {
    setDimensions(prev => prev.map((d, i) => {
      if (i !== dimIdx) return d;
      const newPrices = { ...d.optionPrices };
      delete newPrices[optLabel];
      return { ...d, options: d.options.filter(o => o !== optLabel), optionPrices: newPrices };
    }));
    // clean up draft price
    setDraftPrices(p => { const n = { ...p }; delete n[`${dimIdx}__${optLabel}`]; return n; });
  };

  const handleOptionPriceChange = (dimIdx, optLabel, val) => {
    const key = `${dimIdx}__${optLabel}`;
    setDraftPrices(p => ({ ...p, [key]: val }));
    const num = parseFloat(val);
    setDimensions(prev => prev.map((d, i) => {
      if (i !== dimIdx) return d;
      return { ...d, optionPrices: { ...d.optionPrices, [optLabel]: isNaN(num) ? 0 : num } };
    }));
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const discountPct = inFlashSale ? parseFloat(flashDiscount) : 0;
    const flashPrice  = inFlashSale
      ? Math.round(parseFloat(form.price) * (1 - discountPct / 100))
      : null;

    addProduct({
      ...form,
      seller:       user?.name || "Unknown Seller",
      price:        parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock:        parseInt(form.stock, 10),
      tags:         form.tags.split(",").map(t => t.trim()).filter(Boolean),
      image:        images[0],
      images:       images,
      dimensions,
      // legacy compat
      variantType:  dimensions.length > 0 ? dimensions[0].name : null,
      variants:     dimensions.length > 0
        ? dimensions[0].options.map(o => ({
            label: o,
            priceAdjust: dimensions[0].priceAffecting
              ? (dimensions[0].optionPrices[o] || 0)
              : 0,
          }))
        : [],
      inFlashSale,
      flashDiscount: inFlashSale ? discountPct : 0,
      flashPrice,
    });

    setSubmitted(true);
    setTimeout(() => navigate("/seller/products"), 2200);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM); setImages([]); setErrors({});
    setDimensions([]); setUrlInput(""); setSubmitted(false);
    setInFlashSale(false); setFlashDiscount("10");
    setDraftPrices({});
  };

  // ── Success ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="seller-page">
        <div className="seller-topbar"><div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">Bazaar<span>X</span></Link>
          <span className="seller-role-badge">Seller Panel</span>
        </div></div>
        <div className="seller-success-screen">
          <div className="success-icon">✓</div>
          <h2>Product Published!</h2>
          <p>Your product is now live on BazaarX. Redirecting…</p>
          <div style={{display:"flex",gap:"12px",marginTop:"8px"}}>
            <button className="form-cancel-btn" onClick={handleReset}>+ Add Another</button>
            <Link to="/seller/products" className="seller-primary-btn">View My Products</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page">
      <div className="seller-topbar">
        <div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">Bazaar<span>X</span></Link>
          <span className="seller-role-badge">Seller Panel</span>
          <div className="seller-topbar-links">
            <Link to="/seller"          className="stl">Dashboard</Link>
            <Link to="/seller/products" className="stl">My Products</Link>
            <Link to="/seller/add"      className="stl active">Add Product</Link>
            <Link to="/seller/orders"   className="stl">Orders</Link>
            <Link to="/buyer"           className="stl">View Store</Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">
        <div className="seller-page-header">
          <div>
            <h1 className="seller-page-title">Add New Product</h1>
            <p className="seller-page-sub">Listing as: <strong>{user?.name}</strong></p>
          </div>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Name */}
            <div className="form-field form-field--full">
              <label>Product Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. Handwoven Pashmina Shawl" />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Category */}
            <div className="form-field">
              <label>Category *</label>
              <select name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Price */}
            <div className="form-field">
              <label>Base Price (Rs.) *
                <span className="label-hint"> — starting / lowest variant price</span>
              </label>
              <input name="price" type="number" value={form.price} onChange={handleChange}
                placeholder="e.g. 4500" min="0" step="0.01" />
              {errors.price && <span className="form-error">{errors.price}</span>}
            </div>

            {/* MRP */}
            <div className="form-field">
              <label>Original / MRP (Rs.)
                <span className="label-hint"> optional — shows crossed out</span>
              </label>
              <input name="comparePrice" type="number" value={form.comparePrice}
                onChange={handleChange} placeholder="e.g. 6000" min="0" step="0.01" />
              {errors.comparePrice && <span className="form-error">{errors.comparePrice}</span>}
            </div>

            {/* Stock */}
            <div className="form-field">
              <label>Stock Quantity *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange}
                placeholder="e.g. 20" min="0" />
              {errors.stock && <span className="form-error">{errors.stock}</span>}
            </div>

            {/* ── FLASH SALE TOGGLE ── */}
            <div className="form-field form-field--full">
              <div className="flash-toggle-row">
                <div className="flash-toggle-left">
                  <button
                    type="button"
                    className={`flash-toggle-btn ${inFlashSale ? "flash-toggle-btn--on" : ""}`}
                    onClick={() => setInFlashSale(p => !p)}
                  >
                    <span className="flash-toggle-thumb" />
                  </button>
                  <div>
                    <p className="flash-toggle-label">⚡ Add to Flash Sale</p>
                    <p className="flash-toggle-sub">
                      {inFlashSale
                        ? "This product will appear in the Flash Sale section on the homepage"
                        : "Toggle on to feature this product in the Flash Sale section"}
                    </p>
                  </div>
                </div>
                {inFlashSale && (
                  <div className="flash-discount-wrap">
                    <label className="flash-discount-label">Discount %</label>
                    <div className="flash-discount-input-wrap">
                      <input
                        type="number"
                        className="flash-discount-input"
                        value={flashDiscount}
                        onChange={e => setFlashDiscount(e.target.value)}
                        min="1" max="99" placeholder="10"
                      />
                      <span className="flash-discount-suffix">% off</span>
                    </div>
                    {form.price && !isNaN(form.price) && (
                      <p className="flash-price-preview">
                        Sale price: <strong>Rs. {Math.round(
                          parseFloat(form.price) * (1 - parseFloat(flashDiscount || 0) / 100)
                        ).toLocaleString()}</strong>
                      </p>
                    )}
                    {errors.flashDiscount && <span className="form-error">{errors.flashDiscount}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* ── MULTI-IMAGE ── */}
            <div className="form-field form-field--full">
              <label>
                Product Images *
                <span className="label-hint"> up to {MAX_IMAGES} photos — first is the cover</span>
              </label>

              {images.length > 0 && (
                <div className="multi-img-grid">
                  {images.map((src, i) => (
                    <div key={i}
                      className={`multi-img-card ${activeThumb === i ? "multi-img-card--active" : ""}`}
                      onClick={() => setActiveThumb(i)}>
                      <img src={src} alt={`Product ${i+1}`} className="multi-img-thumb"
                        onError={e => e.target.src="https://placehold.co/80x80?text=?"} />
                      {i === 0 && <span className="multi-img-cover-badge">Cover</span>}
                      <div className="multi-img-actions">
                        {i > 0 && (
                          <button type="button" className="multi-img-btn"
                            onClick={e=>{e.stopPropagation();moveImage(i,-1);}}>←</button>
                        )}
                        {i < images.length-1 && (
                          <button type="button" className="multi-img-btn"
                            onClick={e=>{e.stopPropagation();moveImage(i,1);}}>→</button>
                        )}
                        <button type="button" className="multi-img-btn multi-img-btn--remove"
                          onClick={e=>{e.stopPropagation();removeImage(i);}}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <div className="multi-img-preview">
                  <img src={images[activeThumb] ?? images[0]} alt="Preview"
                    onError={e => e.target.src="https://placehold.co/400x400?text=?"} />
                  <p className="multi-img-preview-label">
                    Image {activeThumb+1} of {images.length}{activeThumb===0?" (Cover)":""}
                  </p>
                </div>
              )}

              {images.length < MAX_IMAGES && (
                <div className="multi-img-add-section">
                  <div className="multi-img-url-row">
                    <input type="text" className="multi-img-url-input" value={urlInput}
                      onChange={e=>{setUrlInput(e.target.value);setUrlError("");}}
                      placeholder="Paste image URL and press Add…"
                      onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),handleAddUrl())} />
                    <button type="button" className="multi-img-url-btn" onClick={handleAddUrl}>
                      + Add URL
                    </button>
                  </div>
                  {urlError && <span className="form-error">{urlError}</span>}
                  <div className="multi-img-divider"><span>or upload from device</span></div>
                  <div className="file-drop-zone" onClick={()=>fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple
                      style={{display:"none"}} onChange={handleFileChange} />
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="#bbb" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>Click to upload — select multiple files at once</p>
                    <span>JPG, PNG, WEBP · max 5 MB each · {MAX_IMAGES-images.length} slot{MAX_IMAGES-images.length!==1?"s":""} left</span>
                  </div>
                  {fileError && <span className="form-error">{fileError}</span>}
                </div>
              )}
              {images.length >= MAX_IMAGES && (
                <p className="multi-img-max-note">✓ Maximum {MAX_IMAGES} images reached.</p>
              )}
              {errors.images && <span className="form-error">{errors.images}</span>}
            </div>

            {/* Description */}
            <div className="form-field form-field--full">
              <label>Description *
                <span className="label-hint"> {form.description.length}/{DESC_MAX}</span>
              </label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Describe your product — materials, size, care instructions…"
                rows={4} maxLength={DESC_MAX} />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            {/* Tags */}
            <div className="form-field form-field--full">
              <label>Tags <span className="label-hint">comma separated</span></label>
              <input name="tags" value={form.tags} onChange={handleChange}
                placeholder="e.g. wool, handmade, winter" />
            </div>

            {/* ── MULTI-DIMENSIONAL VARIANTS ── */}
            <div className="form-field form-field--full">
              <label>
                Product Variants
                <span className="label-hint"> optional — add Size, Color, Volume etc.</span>
              </label>

              {dimensions.length > 0 && (
                <div className="dim-list">
                  {dimensions.map((dim, dimIdx) => (
                    <div key={dimIdx} className="dim-card">

                      {/* Dim header: name + price-affecting toggle + remove */}
                      <div className="dim-header">
                        <span className="dim-name">{dim.name}</span>
                        <div className="dim-header-right">
                          {/* Price-affecting toggle */}
                          <button
                            type="button"
                            className={`dim-price-toggle ${dim.priceAffecting ? "dim-price-toggle--on" : ""}`}
                            onClick={() => togglePriceAffecting(dimIdx)}
                            title={dim.priceAffecting
                              ? "Price changes per option — click to disable"
                              : "Click to make price vary per option"}
                          >
                            <span className="dim-price-toggle-thumb" />
                            <span className="dim-price-toggle-label">
                              {dim.priceAffecting ? "Affects price" : "Same price"}
                            </span>
                          </button>
                          <button type="button" className="dim-remove-btn"
                            onClick={() => removeDimension(dimIdx)}>
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="dim-options">
                        {dim.options.map((opt) => (
                          <div key={opt} className="dim-option-row">
                            <span className="dim-option-chip">
                              {opt}
                              <button type="button" className="dim-option-remove"
                                onClick={() => removeOption(dimIdx, opt)}>×</button>
                            </span>
                            {/* Price adjustment input — only when priceAffecting */}
                            {dim.priceAffecting && (
                              <div className="dim-option-price-wrap">
                                <span className="dim-option-price-prefix">
                                  {form.price && !isNaN(form.price)
                                    ? `Base Rs.${parseFloat(form.price).toLocaleString()} +`
                                    : "+"}
                                </span>
                                <input
                                  type="number"
                                  className="dim-option-price-input"
                                  value={draftPrices[`${dimIdx}__${opt}`] ?? (dim.optionPrices[opt] || "")}
                                  onChange={e => handleOptionPriceChange(dimIdx, opt, e.target.value)}
                                  placeholder="0"
                                  min="0"
                                  step="1"
                                />
                                <span className="dim-option-price-suffix">Rs.</span>
                                {form.price && !isNaN(form.price) && (
                                  <span className="dim-option-final-price">
                                    = Rs. {(
                                      parseFloat(form.price) + (dim.optionPrices[opt] || 0)
                                    ).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        {dim.options.length === 0 && (
                          <span className="dim-empty-hint">No options yet — add some below</span>
                        )}
                      </div>

                      {/* Add options input */}
                      <div className="dim-add-option-row">
                        <input
                          className="dim-option-input"
                          value={newDimOption[dimIdx] || ""}
                          onChange={e => setNewDimOption(p => ({ ...p, [dimIdx]: e.target.value }))}
                          placeholder={
                            dim.name === "Size"        ? "e.g. S, M, L, XL" :
                            dim.name === "Color"       ? "e.g. Red, Blue, Black" :
                            dim.name === "Volume (ml)" ? "e.g. 50ml, 100ml, 200ml" :
                            "e.g. Option1, Option2"
                          }
                          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addOption(dimIdx))}
                        />
                        <button type="button" className="dim-add-btn"
                          onClick={() => addOption(dimIdx)}>+ Add</button>
                      </div>
                      <p className="dim-hint">
                        {dim.priceAffecting
                          ? "Add options above, then set the extra price for each one"
                          : "Tip: type multiple options separated by commas and press Add"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick-add suggested */}
              <div className="dim-quick-row">
                <span className="dim-quick-label">Quick add:</span>
                {suggested.filter(s => !dimensions.some(d => d.name === s)).map(s => (
                  <button key={s} type="button" className="dim-quick-btn"
                    onClick={() => addDimension(s)}>
                    + {s}
                    {PRICE_AFFECTING_DEFAULTS.includes(s) && (
                      <span className="dim-quick-price-tag">price</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom dimension */}
              <div className="dim-custom-row">
                <input
                  className="dim-custom-input"
                  value={newDimName}
                  onChange={e => { setNewDimName(e.target.value); setDimError(""); }}
                  placeholder="Or type a custom variant type (e.g. Material, Finish…)"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addDimension())}
                />
                <button type="button" className="dim-add-btn" onClick={() => addDimension()}>
                  + Add Type
                </button>
              </div>
              {dimError && <span className="form-error">{dimError}</span>}

              {dimensions.length > 0 && (
                <div className="dim-summary">
                  <p className="dim-summary-label">Variant combinations buyers will see:</p>
                  <p className="dim-summary-text">
                    {dimensions.map(d => {
                      const optStr = d.options.length > 0
                        ? d.priceAffecting
                          ? d.options.map(o =>
                              `${o}${d.optionPrices[o] ? ` (+Rs.${d.optionPrices[o]})` : ""}`
                            ).join(", ")
                          : d.options.join(", ")
                        : "(no options)";
                      return `${d.name}: ${optStr}`;
                    }).join("  ·  ")}
                  </p>
                </div>
              )}
            </div>

          </div>

          <div className="form-footer">
            <Link to="/seller/products" className="form-cancel-btn">Cancel</Link>
            <button type="submit" className="seller-primary-btn">Publish Product →</button>
          </div>
        </form>
      </div>
    </div>
  );
}