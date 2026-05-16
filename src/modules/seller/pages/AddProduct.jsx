import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Seller.css";
import "./AddProduct.css";

const CATEGORIES = [
  "Accessories",
  "Bags",
  "Home",
  "Clothing",
  "Kitchen",
  "Beauty",
  "Jewellery",
  "Watches",
  "Stationery",
  "Footwear",
  "Sports",
  "Books",
  "Electronics",
  "Food & Drink",
  "Pets",
  "Baby",
  "Art & Craft",
  "Plants",
  "Toys & Kids",
  "Wellness",
  "Furniture",
];

// Variant types per category
const VARIANT_TYPES = {
  Clothing: ["Size", "Color"],
  Footwear: ["Size", "Color"],
  Electronics: ["Storage", "Color", "Brand"],
  Beauty: ["Volume (ml)", "Shade"],
  "Food & Drink": ["Weight (g)", "Flavour"],
  Jewellery: ["Material", "Size"],
  Bags: ["Color", "Size"],
  Accessories: ["Color", "Size"],
  default: ["Color", "Size", "Material"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DESC_MAX = 600;

const EMPTY_FORM = {
  name: "",
  price: "",
  comparePrice: "",
  category: "Accessories",
  stock: "",
  description: "",
  image: "",
  tags: "",
};

const EMPTY_VARIANT = {
  label: "",
  priceAdjust: "0",
  stock: "",
};

export default function AddProduct() {
  const { addProduct } = useProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [submitted, setSubmitted] = useState(false);
  const [imageMode, setImageMode] = useState("url");
  const [imagePreview, setImagePreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Variant state
  const [variantType, setVariantType] = useState("");
  const [variants, setVariants] = useState([]); // [{label, priceAdjust}]
  const [newVariant, setNewVariant] = useState(EMPTY_VARIANT);
  const [variantError, setVariantError] = useState("");

  const availableTypes = VARIANT_TYPES[form.category] || VARIANT_TYPES.default;

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      e.price = "Enter a valid price";
    if (form.comparePrice && Number(form.comparePrice) <= Number(form.price))
      e.comparePrice = "MRP must be greater than selling price";
    if (!form.stock || isNaN(form.stock) || Number(form.stock) < 0)
      e.stock = "Enter a valid stock quantity";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.image.trim()) e.image = "Product image is required";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "image") setImagePreview(value);
    // Reset variants if category changes
    if (name === "category") {
      setVariants([]);
      setVariantType("");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File too large — max 5 MB.");
      return;
    }
    setFileError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, image: ev.target.result }));
      setImagePreview(ev.target.result);
      setErrors((prev) => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setForm((p) => ({ ...p, image: "" }));
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Variant handlers ──
  const addVariant = () => {
    if (!newVariant.label.trim()) {
      setVariantError("Enter a variant name.");
      return;
    }
    if (
      variants.some(
        (v) => v.label.toLowerCase() === newVariant.label.toLowerCase(),
      )
    ) {
      setVariantError("This variant already exists.");
      return;
    }
    setVariants((prev) => [
      ...prev,
      { ...newVariant, label: newVariant.label.trim() },
    ]);
    setNewVariant(EMPTY_VARIANT);
    setVariantError("");
  };

  const removeVariant = (idx) =>
    setVariants((prev) => prev.filter((_, i) => i !== idx));

  const updateVariant = (idx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)),
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    addProduct({
      ...form,
      seller: user?.name || "Unknown Seller",
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock: parseInt(form.stock, 10),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      variantType: variantType || null,
      variants: variants.map((v) => ({
        label: v.label,
        priceAdjust: parseFloat(v.priceAdjust) || 0,
      })),
    });

    setSubmitted(true);
    setTimeout(() => navigate("/seller/products"), 2200);
  };

  if (submitted) {
    return (
      <div className="seller-page">
        <div className="seller-topbar">
          <div className="seller-topbar-inner">
            <Link to="/buyer" className="seller-logo">
              Bazaar<span>X</span>
            </Link>
            <span className="seller-role-badge">Seller Panel</span>
          </div>
        </div>
        <div className="seller-success-screen">
          <div className="success-icon">✓</div>
          <h2>Product Published!</h2>
          <p>Your product is now live on BazaarX. Redirecting…</p>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button
              className="form-cancel-btn"
              onClick={() => {
                setForm(EMPTY_FORM);
                setImagePreview("");
                setErrors({});
                setVariants([]);
                setVariantType("");
                setSubmitted(false);
              }}
            >
              + Add Another
            </button>
            <Link to="/seller/products" className="seller-primary-btn">
              View My Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page">
      <div className="seller-topbar">
        <div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">
            Bazaar<span>X</span>
          </Link>
          <span className="seller-role-badge">Seller Panel</span>
          <div className="seller-topbar-links">
            <Link to="/seller" className="stl">
              Dashboard
            </Link>
            <Link to="/seller/products" className="stl">
              My Products
            </Link>
            <Link to="/seller/add" className="stl active">
              Add Product
            </Link>
            <Link to="/seller/orders" className="stl">
              Orders
            </Link>
            <Link to="/buyer" className="stl">
              View Store
            </Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">
        <div className="seller-page-header">
          <div>
            <h1 className="seller-page-title">Add New Product</h1>
            <p className="seller-page-sub">
              Listing as: <strong>{user?.name}</strong>
            </p>
          </div>
        </div>

        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Name */}
            <div className="form-field form-field--full">
              <label>Product Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Handwoven Pashmina Shawl"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Category */}
            <div className="form-field">
              <label>Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Selling Price */}
            <div className="form-field">
              <label>Selling Price (Rs.) *</label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 4500"
                min="0"
                step="0.01"
              />
              {errors.price && (
                <span className="form-error">{errors.price}</span>
              )}
            </div>

            {/* MRP */}
            <div className="form-field">
              <label>
                Original / MRP (Rs.){" "}
                <span className="label-hint">optional</span>
              </label>
              <input
                name="comparePrice"
                type="number"
                value={form.comparePrice}
                onChange={handleChange}
                placeholder="e.g. 6000"
                min="0"
                step="0.01"
              />
              {errors.comparePrice && (
                <span className="form-error">{errors.comparePrice}</span>
              )}
            </div>

            {/* Stock */}
            <div className="form-field">
              <label>Stock Quantity *</label>
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={handleChange}
                placeholder="e.g. 20"
                min="0"
              />
              {errors.stock && (
                <span className="form-error">{errors.stock}</span>
              )}
            </div>

            {/* Image */}
            <div className="form-field form-field--full">
              <label>Product Image *</label>
              <div className="image-mode-tabs">
                <button
                  type="button"
                  className={`image-mode-tab ${imageMode === "url" ? "active" : ""}`}
                  onClick={() => {
                    setImageMode("url");
                    handleRemoveImage();
                  }}
                >
                  Paste URL
                </button>
                <button
                  type="button"
                  className={`image-mode-tab ${imageMode === "file" ? "active" : ""}`}
                  onClick={() => {
                    setImageMode("file");
                    handleRemoveImage();
                  }}
                >
                  Upload from Device
                </button>
              </div>
              {imageMode === "url" ? (
                <input
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                />
              ) : (
                <div
                  className="file-drop-zone"
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#bbb"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p>
                    {imagePreview
                      ? "Click to change image"
                      : "Click to upload image"}
                  </p>
                  <span>JPG, PNG, WEBP up to 5 MB</span>
                </div>
              )}
              {fileError && <span className="form-error">{fileError}</span>}
              {imagePreview && (
                <div className="image-preview-wrap">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="image-preview-img"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                  <div className="image-preview-meta">
                    <span className="image-preview-label">Preview</span>
                    <button
                      type="button"
                      className="image-preview-remove"
                      onClick={handleRemoveImage}
                    >
                      × Remove
                    </button>
                  </div>
                </div>
              )}
              {errors.image && (
                <span className="form-error">{errors.image}</span>
              )}
            </div>

            {/* Description */}
            <div className="form-field form-field--full">
              <label>
                Description *{" "}
                <span className="label-hint">
                  {form.description.length}/{DESC_MAX}
                </span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your product — materials, size, care instructions…"
                rows={4}
                maxLength={DESC_MAX}
              />
              {errors.description && (
                <span className="form-error">{errors.description}</span>
              )}
            </div>

            {/* Tags */}
            <div className="form-field form-field--full">
              <label>
                Tags <span className="label-hint">comma separated</span>
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                placeholder="e.g. wool, handmade, winter"
              />
            </div>

            {/* ── VARIANTS SECTION ── */}
            <div className="form-field form-field--full">
              <label>
                Product Variants
                <span className="label-hint">
                  {" "}
                  optional — e.g. sizes, colors, storage options
                </span>
              </label>

              {/* Variant type selector */}
              <div className="variant-type-row">
                <select
                  className="variant-type-select"
                  value={variantType}
                  onChange={(e) => {
                    setVariantType(e.target.value);
                    setVariants([]);
                  }}
                >
                  <option value="">— No variants / single option —</option>
                  {availableTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="custom">Custom…</option>
                </select>
                {variantType === "custom" && (
                  <input
                    className="variant-custom-input"
                    placeholder="Enter variant type name (e.g. Finish)"
                    onBlur={(e) => setVariantType(e.target.value || "custom")}
                  />
                )}
              </div>

              {/* Add variants */}
              {variantType && variantType !== "custom" && (
                <div className="variant-builder">
                  <p className="variant-builder-label">
                    Add {variantType} options — each can have a price adjustment
                  </p>

                  {/* Existing variants */}
                  {variants.length > 0 && (
                    <div className="variant-list">
                      {variants.map((v, i) => (
                        <div key={i} className="variant-row">
                          <input
                            className="variant-label-input"
                            value={v.label}
                            onChange={(e) =>
                              updateVariant(i, "label", e.target.value)
                            }
                            placeholder="e.g. Red"
                          />

                          <div className="variant-price-wrap">
                            <span className="variant-price-prefix">± Rs.</span>

                            <input
                              className="variant-price-input"
                              type="number"
                              value={v.priceAdjust}
                              onChange={(e) =>
                                updateVariant(i, "priceAdjust", e.target.value)
                              }
                              placeholder="0"
                            />
                          </div>

                          <input
                            className="variant-stock-input"
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) =>
                              updateVariant(i, "stock", e.target.value)
                            }
                            placeholder="Stock"
                          />

                          <span className="variant-final-price">
                            Rs.{" "}
                            {(
                              parseFloat(form.price || 0) +
                              parseFloat(v.priceAdjust || 0)
                            ).toLocaleString()}
                          </span>

                          <button
                            type="button"
                            className="variant-remove-btn"
                            onClick={() => removeVariant(i)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New variant input */}
                  <div className="variant-add-row">
                    <input
                      className="variant-label-input"
                      value={newVariant.label}
                      onChange={(e) =>
                        setNewVariant((p) => ({
                          ...p,
                          label: e.target.value,
                        }))
                      }
                      placeholder={`e.g. ${
                        variantType === "Color"
                          ? "Red"
                          : variantType === "Size"
                            ? "M"
                            : variantType === "Storage"
                              ? "128GB"
                              : "Option"
                      }`}
                    />

                    <div className="variant-price-wrap">
                      <span className="variant-price-prefix">± Rs.</span>

                      <input
                        className="variant-price-input"
                        type="number"
                        value={newVariant.priceAdjust}
                        onChange={(e) =>
                          setNewVariant((p) => ({
                            ...p,
                            priceAdjust: e.target.value,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>

                    <input
                      className="variant-stock-input"
                      type="number"
                      min="0"
                      value={newVariant.stock}
                      onChange={(e) =>
                        setNewVariant((p) => ({
                          ...p,
                          stock: e.target.value,
                        }))
                      }
                      placeholder="Stock"
                    />

                    <button
                      type="button"
                      className="variant-add-btn"
                      onClick={addVariant}
                    >
                      + Add
                    </button>
                  </div>
                  {variantError && (
                    <span className="form-error">{variantError}</span>
                  )}

                  <p className="variant-hint">
                    💡 Base price: Rs.{" "}
                    {parseFloat(form.price || 0).toLocaleString()}. Use ± to
                    charge more or less for specific options. Leave 0 for same
                    price.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <Link to="/seller/products" className="form-cancel-btn">
              Cancel
            </Link>
            <button type="submit" className="seller-primary-btn">
              Publish Product →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
