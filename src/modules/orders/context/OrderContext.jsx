import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useProducts } from "../../products/hooks/useProducts";

const OrderContext = createContext(null);

// Track credited orders in localStorage so we never double-credit
const getCreditedSet = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem("bazaarx_credited_orders") || "[]"));
  } catch { return new Set(); }
};

const saveCreditedSet = (set) => {
  localStorage.setItem("bazaarx_credited_orders", JSON.stringify([...set]));
};

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(() => {
    // Persist orders in localStorage so they survive page refresh
    try {
      const saved = localStorage.getItem("bazaarx_orders");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const { decreaseStock } = useProducts();

  // We use a ref to access creditSeller from WalletContext
  // without creating a circular dependency. App.jsx will inject it.
  const creditSellerRef = useRef(null);

  // Expose a way for WalletProvider to inject the creditSeller function
  const setCreditSeller = (fn) => { creditSellerRef.current = fn; };

  // Persist orders whenever they change
  useEffect(() => {
    localStorage.setItem("bazaarx_orders", JSON.stringify(orders));
  }, [orders]);

  // ── Credit wallet for any already-delivered orders on mount ──
  // This handles the case where page refreshed after delivery
  useEffect(() => {
    const credited = getCreditedSet();
    orders.forEach(order => {
      if (order.status !== "delivered") return;
      if (credited.has(order.id)) return;
      creditOrder(order, credited);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const creditOrder = (order, creditedSet) => {
    if (!creditSellerRef.current) return;
    if (creditedSet.has(order.id)) return;

    // Group items by seller and credit each seller separately
    const sellerTotals = {};
    order.items.forEach(item => {
      sellerTotals[item.seller] = (sellerTotals[item.seller] || 0) + item.price * item.quantity;
    });

    Object.entries(sellerTotals).forEach(([sellerName, gross]) => {
      creditSellerRef.current(sellerName, gross);
    });

    creditedSet.add(order.id);
    saveCreditedSet(creditedSet);
  };

  const placeOrder = ({ items, total, paymentMethod, buyer, address }) => {
    const newOrder = {
      id: "ORD-" + Date.now(),
      items,
      total,
      paymentMethod,
      buyer,
      address,
      status: "confirmed",
      placedAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    decreaseStock(items);
    return newOrder;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        const updatedOrder = { ...o, status: newStatus };

        // Credit wallet the moment status hits "delivered"
        if (newStatus === "delivered") {
          const credited = getCreditedSet();
          if (!credited.has(orderId)) {
            // Use setTimeout so state has settled before crediting
            setTimeout(() => creditOrder(updatedOrder, credited), 100);
          }
        }

        return updatedOrder;
      });
      return updated;
    });
  };

  const getOrdersByBuyer   = (email)      => orders.filter((o) => o.buyer?.email === email);
  const getOrdersBySeller  = (sellerName) => orders.filter((o) => o.items.some((i) => i.seller === sellerName));

  return (
    <OrderContext.Provider value={{
      orders, placeOrder,
      getOrdersByBuyer, getOrdersBySeller,
      updateOrderStatus, setCreditSeller,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be inside OrderProvider");
  return ctx;
}