// modules/orders/hooks/useOrders.js
// Re-exports useOrders hook + pure order utility functions
export { useOrders } from "../context/OrderContext";

// Platform commission rate — admin earns this % from every sale
export const COMMISSION_RATE = 10;

// Calculate seller earnings after commission deduction
export const calcSellerEarnings = (orderTotal) =>
  Math.round(orderTotal * ((100 - COMMISSION_RATE) / 100));

// Calculate platform commission from an order
export const calcPlatformCommission = (orderTotal) =>
  Math.round(orderTotal * (COMMISSION_RATE / 100));

// Get seller's items from a mixed order
export const getSellerItems = (order, sellerName) =>
  order.items.filter((item) => item.seller === sellerName);

// Calculate seller's revenue from one order
export const calcOrderRevenue = (order, sellerName) => {
  const myItems = getSellerItems(order, sellerName);
  return myItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Get orders for a specific buyer
export const getOrdersByBuyer = (orders, email) =>
  orders.filter((o) => o.buyer?.email === email);

// Get orders for a specific seller
export const getOrdersBySeller = (orders, sellerName) =>
  orders.filter((o) =>
    o.items.some((item) => item.seller === sellerName)
  );

// Order status helpers
export const ORDER_STATUSES = ["confirmed","processing","shipped","delivered","cancelled"];

export const STATUS_COLORS = {
  confirmed:  { bg: "#e3f2fd", color: "#1565c0" },
  processing: { bg: "#fff8e1", color: "#f57f17" },
  shipped:    { bg: "#e8eaf6", color: "#283593" },
  delivered:  { bg: "#e8f5e9", color: "#2e7d32" },
  cancelled:  { bg: "#ffebee", color: "#c62828" },
};

export const isOrderActive = (order) =>
  !["delivered", "cancelled"].includes(order.status);

export const isOrderComplete = (order) =>
  order.status === "delivered";

// Format order date nicely
export const formatOrderDate = (isoString) =>
  new Date(isoString).toLocaleDateString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
  });

// Generate order summary text
export const getOrderSummary = (order) =>
  `${order.items.length} item${order.items.length > 1 ? "s" : ""} · Rs. ${order.total.toLocaleString()}`;