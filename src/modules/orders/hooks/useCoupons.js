export { useCoupons } from "../context/CouponContext";

// Coupon type labels
export const COUPON_TYPES = {
  percent:  "Percentage Discount",
  fixed:    "Fixed Amount Off",
  freeship: "Free Shipping",
};

// Get coupon badge color
export const getCouponColor = (type) => {
  if (type === "percent")  return { bg: "#e8f5e9", color: "#2e7d32" };
  if (type === "fixed")    return { bg: "#e3f2fd", color: "#1565c0" };
  if (type === "freeship") return { bg: "#fff8e1", color: "#f57f17" };
  return { bg: "#f5f5f5", color: "#555" };
};

// Format discount display
export const formatDiscount = (coupon) => {
  if (coupon.type === "percent")  return `${coupon.value}% OFF`;
  if (coupon.type === "fixed")    return `Rs. ${coupon.value} OFF`;
  if (coupon.type === "freeship") return "FREE SHIP";
  return "";
};