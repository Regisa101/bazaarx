import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useProducts } from "../../products/hooks/useProducts";
import { useAuth } from "../../auth/hooks/useAuth";
import "./Seller.css";

const CATEGORIES = [
  "All",
  "Accessories", "Bags", "Home", "Clothing", "Kitchen",
  "Beauty", "Jewellery", "Watches", "Stationery", "Footwear",
  "Sports", "Books", "Electronics", "Food & Drink", "Pets",
  "Baby", "Art & Craft", "Plants", "Toys & Kids", "Wellness", "Furniture",
];

function getStockStatus(stock) {
  if (stock === 0) return { label: "Out of Stock", cls: "stock-chip--out" };
  if (stock < 5)  return { label: `${stock} left`,  cls: "stock-chip--low" };
  return              { label: `${stock} in stock`, cls: "stock-chip--ok"  };
}

export default function MyProducts() {
  const { user }    = useAuth();
  const { getSellerProducts, deleteProduct, updateProduct } = useProducts();
  const allProducts = getSellerProducts(user?.name || "");

  const [editingId,      setEditingId]      = useState(null);
  const [editForm,       setEditForm]       = useState({});
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  // ── Filter / sort state ──
  const [search,         setSearch]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter,    setStockFilter]    = useState("all"); // all | low | out
  const [sortBy,         setSortBy]         = useState("newest");

  // ── Derived list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== "All")
      list = list.filter((p) => p.category === categoryFilter);

    if (stockFilter === "low") list = list.filter((p) => p.stock > 0 && p.stock < 5);
    if (stockFilter === "out") list = list.filter((p) => p.stock === 0);

    switch (sortBy) {
      case "price-asc":   list.sort((a, b) => a.price - b.price);                  break;
      case "price-desc":  list.sort((a, b) => b.price - a.price);                  break;
      case "stock-asc":   list.sort((a, b) => a.stock - b.stock);                  break;
      case "stock-desc":  list.sort((a, b) => b.stock - a.stock);                  break;
      case "name":        list.sort((a, b) => a.name.localeCompare(b.name));        break;
      default: break; // newest — keep insertion order
    }

    return list;
  }, [allProducts, search, categoryFilter, stockFilter, sortBy]);

  // ── Edit helpers ──────────────────────────────────────────────────────────
  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm({
      name:         p.name,
      price:        p.price,
      comparePrice: p.comparePrice || "",
      stock:        p.stock,
      category:     p.category,
      description:  p.description,
      tags:         Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
    });
  };

  const saveEdit = () => {
    updateProduct(editingId, {
      ...editForm,
      price:        parseFloat(editForm.price),
      comparePrice: editForm.comparePrice ? parseFloat(editForm.comparePrice) : null,
      stock:        parseInt(editForm.stock, 10),
      tags:         editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setEditingId(null);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    setStockFilter("all");
    setSortBy("newest");
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="seller-page">
      {/* Topbar */}
      <div className="seller-topbar">
        <div className="seller-topbar-inner">
          <Link to="/buyer" className="seller-logo">Bazaar<span>X</span></Link>
          <span className="seller-role-badge">Seller Panel</span>
          <div className="seller-topbar-links">
            <Link to="/seller"          className="stl">Dashboard</Link>
            <Link to="/seller/products" className="stl active">My Products</Link>
            <Link to="/seller/add"      className="stl">Add Product</Link>
            <Link to="/seller/orders"   className="stl">Orders</Link>
            <Link to="/buyer"           className="stl">View Store</Link>
          </div>
          <span className="seller-topbar-user">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="seller-container">
        <div className="seller-page-header">
          <div>
            <h1 className="seller-page-title">My Products</h1>
            <p className="seller-page-sub">
              {filtered.length} of {allProducts.length} products
            </p>
          </div>
          <Link to="/seller/add" className="seller-primary-btn">+ Add Product</Link>
        </div>

        {/* ── Filter bar (only when there are products) ── */}
        {allProducts.length > 0 && (
          <div className="mp-filter-bar">
            <div className="mp-search-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                className="mp-search"
                placeholder="Search by name, category or tag…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="mp-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <select
              className="mp-filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>

            <select
              className="mp-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="name">Name A–Z</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="stock-asc">Stock: Low → High</option>
              <option value="stock-desc">Stock: High → Low</option>
            </select>
          </div>
        )}

        {/* ── Empty states ── */}
        {allProducts.length === 0 ? (
          <div className="seller-empty">
            <p>No products yet.</p>
            <Link to="/seller/add" className="seller-primary-btn">
              Add Your First Product
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="seller-empty">
            <p>No products match your filters.</p>
            <button className="form-cancel-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          /* ── Product list ── */
          <div className="my-products-list">
            {filtered.map((p) => {
              const stockStatus = getStockStatus(p.stock);
              return (
                <div key={p.id} className="mp-card">

                  {/* ── Edit mode ── */}
                  {editingId === p.id ? (
                    <div className="mp-edit-form">
                      <img src={p.image} alt={p.name} className="mp-img" />
                      <div className="mp-edit-fields">

                        {/* Row 1: name + category */}
                        <div className="mp-edit-row">
                          <div className="mp-edit-field-group">
                            <label>Product Name</label>
                            <input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              placeholder="Product name"
                            />
                          </div>
                          <div className="mp-edit-field-group">
                            <label>Category</label>
                            <select
                              value={editForm.category}
                              onChange={(e) =>
                                setEditForm({ ...editForm, category: e.target.value })
                              }
                            >
                              {CATEGORIES.slice(1).map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Row 2: price + compare price + stock */}
                        <div className="mp-edit-row mp-edit-row--3">
                          <div className="mp-edit-field-group">
                            <label>Selling Price (Rs.)</label>
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: e.target.value })
                              }
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="mp-edit-field-group">
                            <label>Original MRP (Rs.)</label>
                            <input
                              type="number"
                              value={editForm.comparePrice}
                              onChange={(e) =>
                                setEditForm({ ...editForm, comparePrice: e.target.value })
                              }
                              min="0"
                              step="0.01"
                              placeholder="optional"
                            />
                          </div>
                          <div className="mp-edit-field-group">
                            <label>Stock</label>
                            <input
                              type="number"
                              value={editForm.stock}
                              onChange={(e) =>
                                setEditForm({ ...editForm, stock: e.target.value })
                              }
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mp-edit-field-group">
                          <label>Description</label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                            rows={2}
                            placeholder="Product description"
                          />
                        </div>

                        {/* Tags */}
                        <div className="mp-edit-field-group">
                          <label>
                            Tags{" "}
                            <span style={{ fontWeight: 400, color: "#aaa", fontSize: "0.75rem" }}>
                              (comma separated)
                            </span>
                          </label>
                          <input
                            value={editForm.tags}
                            onChange={(e) =>
                              setEditForm({ ...editForm, tags: e.target.value })
                            }
                            placeholder="e.g. wool, handmade, winter"
                          />
                        </div>

                        <div className="mp-edit-actions">
                          <button className="seller-primary-btn" onClick={saveEdit}>
                            Save Changes
                          </button>
                          <button
                            className="form-cancel-btn"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>

                  ) : (
                    /* ── View mode ── */
                    <div className="mp-view">
                      <img src={p.image} alt={p.name} className="mp-img" />

                      <div className="mp-info">
                        <p className="mp-cat">{p.category}</p>
                        <p className="mp-name">{p.name}</p>
                        <p className="mp-desc">{p.description}</p>
                        {p.tags?.length > 0 && (
                          <div className="mp-tags">
                            {p.tags.slice(0, 4).map((t, i) => (
                              <span key={i} className="mp-tag">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mp-meta">
                        <p className="mp-price">Rs. {p.price.toLocaleString()}</p>
                        {p.comparePrice && (
                          <p className="mp-compare-price">
                            Rs. {p.comparePrice.toLocaleString()}
                          </p>
                        )}
                        <span className={`stock-chip ${stockStatus.cls}`}>
                          {stockStatus.label}
                        </span>
                      </div>

                      <div className="mp-actions">
                        <button
                          className="mp-btn-edit"
                          onClick={() => startEdit(p)}
                        >
                          Edit
                        </button>

                        {deleteConfirm === p.id ? (
                          <div className="mp-confirm-delete">
                            <span>Delete?</span>
                            <button
                              className="mp-btn-del-confirm"
                              onClick={() => {
                                deleteProduct(p.id);
                                setDeleteConfirm(null);
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="mp-btn-del-cancel"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="mp-btn-delete"
                            onClick={() => setDeleteConfirm(p.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}