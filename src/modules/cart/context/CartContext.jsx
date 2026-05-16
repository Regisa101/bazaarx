import { createContext, useContext, useState, useRef } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // ✅ FIX: useRef so this persists across renders.
  // The old `const productsRef = { current: [] }` was a plain object recreated
  // on every render — writes via setProductsRef were thrown away immediately,
  // so getStock always returned 0 and blocked every second add.
  const productsRef = useRef([]);

  const setProductsRef = (products) => {
    productsRef.current = products;
  };

  const getStock = (productId) => {
    const p = productsRef.current.find((p) => p.id === productId);
    return p?.stock ?? 0;
  };

  // ── addToCart ─────────────────────────────────────────────────
  // variantKey   — composite string e.g. "Red|M" or "100ml" or null
  // variantLabel — human-readable e.g. "Color: Red, Size: M"
  // variantPrice — final price for this variant combination
  //
  // Each unique cartId (product + variant combo) is its own cart row,
  // so buyers CAN add Red|M and Blue|L as separate items simultaneously.
  const addToCart = (
    product,
    variantKey = null,
    variantLabel = null,
    variantPrice = null
  ) => {
    const cartId = variantKey
      ? `${product.id}__${variantKey}`
      : String(product.id);
    const price = variantPrice ?? product.price;
    const maxStock = getStock(product.id);

    setCartItems((prev) => {
      // Stock is per-product, not per-variant — count ALL variants of this product
      const totalInCart = prev
        .filter((item) => item.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (totalInCart >= maxStock) return prev;

      const existing = prev.find((item) => item.cartId === cartId);

      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          ...product,
          cartId,
          price,
          variantKey,
          variantLabel,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (cartId) =>
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));

  const updateQuantity = (cartId, qty, maxStock = 9999) => {
    if (qty < 1) {
      removeFromCart(cartId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartId === cartId
          ? { ...item, quantity: Math.min(qty, maxStock) }
          : item
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        setProductsRef,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}