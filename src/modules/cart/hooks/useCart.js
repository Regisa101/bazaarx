// modules/cart/hooks/useCart.js
// Re-exports useCart hook + pure cart utility functions
// Keeping business logic separate from React state (CartContext)
export { useCart } from "../context/CartContext";

// Calculate subtotal from all cart items
export const calcSubtotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

// Count total number of individual items
export const calcItemCount = (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

// Check if a product is already in cart
export const isInCart = (items, productId) =>
  items.some((item) => item.id === productId);

// Get quantity of a specific product in cart
export const getItemQuantity = (items, productId) => {
  const found = items.find((item) => item.id === productId);
  return found ? found.quantity : 0;
};

// Calculate delivery fee — free above Rs. 2000
export const calcDeliveryFee = (subtotal) =>
  subtotal >= 2000 ? 0 : 120;

// Calculate grand total including delivery
export const calcGrandTotal = (items) => {
  const subtotal = calcSubtotal(items);
  return subtotal + calcDeliveryFee(subtotal);
};

// Format price in Nepali Rupees
export const formatPrice = (amount) =>
  `Rs. ${amount.toLocaleString()}`;