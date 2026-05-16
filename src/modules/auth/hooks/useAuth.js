// modules/auth/hooks/useAuth.js
// Re-exports useAuth hook from context — module-based pattern
export { useAuth } from "../context/AuthContext";

// Role constants — use these instead of hardcoding strings
export const ROLES = {
  BUYER:  "buyer",
  SELLER: "seller",
  ADMIN:  "admin",
};

// Helper functions — use these in components instead of checking role directly
export const isBuyer  = (user) => user?.role === ROLES.BUYER;
export const isSeller = (user) => user?.role === ROLES.SELLER;
export const isAdmin  = (user) => user?.role === ROLES.ADMIN;

// Check if seller has completed onboarding setup
export const isSellerSetupDone = (user) =>
  user?.storeSetupDone && user?.paymentSetupDone;

// Check if account is active and approved
export const isActiveUser = (user) =>
  user?.status === "active" && user?.approved !== false;

// Get display name safely
export const getDisplayName = (user) =>
  user?.name?.split(" ")[0] || "User";

// Get user initials for avatar
export const getUserInitials = (user) =>
  user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";