import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // products ref injected from ProductContext so we can check live stock
  const productsRef = { current: [] };
  const setProductsRef = (products) => { productsRef.current = products; };

  const getStock = (productId) => {
    const p = productsRef.current.find((p) => p.id === productId);
    return p?.stock ?? 0;
  };

  // addToCart now accepts optional variantKey so different variants are separate cart items
  const addToCart = (product, variantKey = null, variantLabel = null, variantPrice = null) => {
    const cartId   = variantKey ? `${product.id}__${variantKey}` : String(product.id);
    const price    = variantPrice ?? product.price;
    const maxStock = getStock(product.id);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      const currentQty = existing ? existing.quantity : 0;

      // Hard cap at stock
      if (currentQty >= maxStock) return prev;

      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId
            ? { ...item, quantity: Math.min(item.quantity + 1, maxStock) }
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

  const removeFromCart = (cartId) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, qty, maxStock = 9999) => {
    if (qty < 1) { removeFromCart(cartId); return; }
    const capped = Math.min(qty, maxStock);
    setCartItems((prev) =>
      prev.map((item) => item.cartId === cartId ? { ...item, quantity: capped } : item)
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity,
      clearCart, cartCount, cartTotal, setProductsRef,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}