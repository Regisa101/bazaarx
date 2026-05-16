import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useProducts } from "../../products/hooks/useProducts";
import "./Admin.css";

export default function ManageProducts() {
  const { user, logout } = useAuth();
  const { products, deleteProduct } = useProducts();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.seller.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link to="/buyer" className="admin-logo">Bazaar<span>X</span></Link>
          <span className="admin-role-badge">Admin Panel</span>
          <div className="admin-topbar-links">
            <Link to="/admin" className="atl">Dashboard</Link>
            <Link to="/admin/products" className="atl active">Products</Link>
            <Link to="/admin/users" className="atl">Users</Link>
            <Link to="/buyer" className="atl">View Store</Link>
          </div>
          <div className="admin-topbar-right">
            <span className="admin-topbar-user">{user?.name}</span>
            <button onClick={logout} className="admin-logout">Logout</button>
          </div>
        </div>
      </div>

      <div className="admin-container">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Manage Products</h1>
            <p className="admin-page-sub">{products.length} total products</p>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search"
          />
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Product</span>
            <span>Seller</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Action</span>
          </div>
          {filtered.map((p) => (
            <div key={p.id} className="admin-table-row">
              <div className="admin-product-cell">
                <img src={p.image} alt={p.name} className="admin-product-img" />
                <span className="admin-product-name">{p.name}</span>
              </div>
              <span className="admin-cell">{p.seller}</span>
              <span className="admin-cell">{p.category}</span>
              <span className="admin-cell">Rs. {p.price.toLocaleString()}</span>
              <span className={`admin-cell ${p.stock < 5 ? "admin-low" : ""}`}>{p.stock}</span>
              <div className="admin-cell">
                {deleteConfirm === p.id ? (
                  <div className="admin-confirm">
                    <button className="admin-btn-del-confirm" onClick={() => { deleteProduct(p.id); setDeleteConfirm(null); }}>Delete</button>
                    <button className="admin-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="admin-btn-remove" onClick={() => setDeleteConfirm(p.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}