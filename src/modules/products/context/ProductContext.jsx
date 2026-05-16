import { createContext, useContext, useState, useEffect } from "react";
import { useCart } from "../../cart/context/CartContext";
import initialProducts from "../../../data/products";

const ProductContext = createContext(null);

const STORAGE_KEY = "bazaarx_products";

export function ProductProvider({ children }) {
  // Load from localStorage first — products persist across refreshes
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load products from localStorage:", e);
    }
    return initialProducts;
  });

  const { setProductsRef } = useCart();

  // Keep CartContext's product ref in sync so it can check stock
  useEffect(() => {
    setProductsRef(products);
  }, [products]);

  // Save to localStorage whenever products change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn("Could not save products to localStorage:", e);
    }
  }, [products]);

  // ── Product CRUD ──────────────────────────────────────────────
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now(),
      rating: 0,
      reviews: [],
      stock: parseInt(product.stock) || 0,
      price: parseFloat(product.price) || 0,
      variants: product.variants || [],
    };
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  };

  const deleteProduct = (id) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const updateProduct = (id, updated) =>
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );

  // Decrease stock when an order is placed.
  // cart items have a `cartId` like "42__Red|M" — we match on product id only
  // since stock is per-product (not per-variant) in this data model.
  const decreaseStock = (items) => {
    // Group quantities by product id (sum across all variants of same product)
    const totals = {};
    items.forEach((item) => {
      const pid = item.id;
      totals[pid] = (totals[pid] || 0) + item.quantity;
    });

    setProducts((prev) =>
      prev.map((p) => {
        const qty = totals[p.id];
        if (!qty) return p;
        return { ...p, stock: Math.max(0, p.stock - qty) };
      })
    );
  };

  // ── Reviews ───────────────────────────────────────────────────
  const addReview = (productId, review) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const reviews = [review, ...(p.reviews || [])];
        const rating =
          reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
        return { ...p, reviews, rating };
      })
    );
  };

  const removeReview = (productId, reviewId) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const reviews = p.reviews.filter((r) => r.id !== reviewId);
        const rating =
          reviews.length > 0
            ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
            : 0;
        return { ...p, reviews, rating };
      })
    );
  };

  const getSellerProducts = (sellerName) =>
    products.filter((p) => p.seller === sellerName);

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        deleteProduct,
        updateProduct,
        decreaseStock,
        addReview,
        removeReview,
        getSellerProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProducts must be inside ProductProvider");
  return ctx;
}