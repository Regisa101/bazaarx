// modules/products/hooks/useProducts.js
// Re-exports useProducts hook + pure product utility functions
export { useProducts } from "../context/ProductContext";

// Calculate average rating from reviews array only
// Returns 0 if no reviews — never uses fake fallback
export const calcAvgRating = (reviews) => {
  if (!Array.isArray(reviews) || reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  return total / reviews.length;
};

// Check if product is out of stock
export const isOutOfStock = (product) => product?.stock === 0;

// Check if product is running low
export const isLowStock = (product) =>
  product?.stock > 0 && product?.stock < 5;

// Get stock status label
export const getStockStatus = (product) => {
  if (isOutOfStock(product))  return "out";
  if (isLowStock(product))    return "low";
  return "ok";
};

// Filter products by category
export const filterByCategory = (products, category) =>
  category === "All"
    ? products
    : products.filter((p) => p.category === category);

// Filter products by search term
export const filterBySearch = (products, search) => {
  if (!search?.trim()) return products;
  const lo = search.toLowerCase();
  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(lo) ||
      p.seller?.toLowerCase().includes(lo) ||
      p.category?.toLowerCase().includes(lo)
  );
};

// Sort products
export const sortProducts = (products, sortBy) => {
  const copy = [...products];
  switch (sortBy) {
    case "price_asc":  return copy.sort((a, b) => a.price - b.price);
    case "price_desc": return copy.sort((a, b) => b.price - a.price);
    case "rating":     return copy.sort((a, b) => calcAvgRating(b.reviews) - calcAvgRating(a.reviews));
    case "newest":     return copy.sort((a, b) => b.id - a.id);
    default:           return copy;
  }
};

// Get products by seller
export const getSellerProducts = (products, sellerName) =>
  products.filter((p) => p.seller === sellerName);

// Truncate product name for cards
export const truncateName = (name, max = 30) =>
  name?.length > max ? name.slice(0, max) + "…" : name;