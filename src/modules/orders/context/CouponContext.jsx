import { createContext, useContext, useState } from "react";

const CouponContext = createContext(null);

// Pre-loaded coupons — admin can add more
const INITIAL_COUPONS = [
  {
    id: 1,
    code: "WELCOME20",
    type: "percent",       // percent | fixed | freeship
    value: 20,             // 20% off
    minOrder: 0,
    maxUses: 100,
    usedCount: 12,
    active: true,
    expiresAt: "2025-12-31",
    description: "20% off for new users",
  },
  {
    id: 2,
    code: "NEPAL10",
    type: "percent",
    value: 10,
    minOrder: 1000,
    maxUses: 500,
    usedCount: 87,
    active: true,
    expiresAt: "2025-12-31",
    description: "10% off on orders above Rs. 1,000",
  },
  {
    id: 3,
    code: "FREESHIP",
    type: "freeship",
    value: 120,            // waives delivery fee
    minOrder: 0,
    maxUses: 200,
    usedCount: 45,
    active: true,
    expiresAt: "2025-12-31",
    description: "Free delivery on any order",
  },
  {
    id: 4,
    code: "FLAT500",
    type: "fixed",
    value: 500,            // Rs. 500 off
    minOrder: 2000,
    maxUses: 50,
    usedCount: 3,
    active: true,
    expiresAt: "2025-12-31",
    description: "Rs. 500 off on orders above Rs. 2,000",
  },
];

export function CouponProvider({ children }) {
  const [coupons, setCoupons] = useState(INITIAL_COUPONS);

  // Validate a coupon code against cart total
  const validateCoupon = (code, cartTotal) => {
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );

    if (!coupon)          return { valid: false, error: "Coupon not found." };
    if (!coupon.active)   return { valid: false, error: "This coupon is no longer active." };
    if (coupon.usedCount >= coupon.maxUses)
                          return { valid: false, error: "This coupon has reached its usage limit." };
    if (new Date(coupon.expiresAt) < new Date())
                          return { valid: false, error: "This coupon has expired." };
    if (cartTotal < coupon.minOrder)
                          return { valid: false, error: `Minimum order of Rs. ${coupon.minOrder.toLocaleString()} required.` };

    return { valid: true, coupon };
  };

  // Calculate discount amount
  const calcDiscount = (coupon, cartTotal, deliveryFee) => {
    if (!coupon) return 0;
    if (coupon.type === "percent")  return Math.round(cartTotal * coupon.value / 100);
    if (coupon.type === "fixed")    return Math.min(coupon.value, cartTotal);
    if (coupon.type === "freeship") return deliveryFee;
    return 0;
  };

  // Use a coupon — increment usage count
  const useCoupon = (code) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.code.toUpperCase() === code.toUpperCase()
          ? { ...c, usedCount: c.usedCount + 1 }
          : c
      )
    );
  };

  // Admin: add new coupon
  const addCoupon = (couponData) => {
    const newCoupon = {
      ...couponData,
      id: Date.now(),
      usedCount: 0,
      active: true,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    return newCoupon;
  };

  // Admin: toggle coupon active/inactive
  const toggleCoupon = (id) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  // Admin: delete coupon
  const deleteCoupon = (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <CouponContext.Provider value={{
      coupons, validateCoupon, calcDiscount,
      useCoupon, addCoupon, toggleCoupon, deleteCoupon,
    }}>
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupons() {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error("useCoupons must be inside CouponProvider");
  return ctx;
}