import { createContext, useContext, useState, useEffect } from "react";
import { useOrders } from "../../orders/hooks/useOrders";

const WalletContext = createContext(null);

const COMMISSION_RATE = 10;

const loadWallets = () => {
  try {
    const s = localStorage.getItem("bazaarx_wallets");
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
};

const loadWithdrawals = () => {
  try {
    const s = localStorage.getItem("bazaarx_withdrawals");
    return s ? JSON.parse(s) : [];
  } catch { return []; }
};

export function WalletProvider({ children }) {
  const [wallets,     setWallets]     = useState(loadWallets);
  const [withdrawals, setWithdrawals] = useState(loadWithdrawals);

  // Get setCreditSeller from OrderContext so we can inject creditSeller into it
  const { setCreditSeller } = useOrders();

  // ── creditSeller: called automatically by OrderContext on delivery ──
  const creditSeller = (sellerName, grossAmount) => {
    const commission = Math.round(grossAmount * COMMISSION_RATE / 100);
    const net        = grossAmount - commission;

    setWallets(prev => {
      const existing = prev[sellerName] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
      return {
        ...prev,
        [sellerName]: {
          ...existing,
          totalEarned:     existing.totalEarned     + net,
          totalCommission: existing.totalCommission + commission,
        },
      };
    });
  };

  // Inject creditSeller into OrderContext once on mount
  useEffect(() => {
    setCreditSeller(creditSeller);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem("bazaarx_wallets",     JSON.stringify(wallets));     }, [wallets]);
  useEffect(() => { localStorage.setItem("bazaarx_withdrawals", JSON.stringify(withdrawals)); }, [withdrawals]);

  // ── Seller requests withdrawal ──
  const requestWithdrawal = (sellerName, amount, method, accountNumber, accountName) => {
    const wallet    = wallets[sellerName] || { totalEarned: 0, withdrawn: 0, pending: 0 };
    const available = Math.max(0, wallet.totalEarned - (wallet.withdrawn || 0) - (wallet.pending || 0));

    if (amount > available) return { ok: false, error: "Amount exceeds available balance." };
    if (amount < 100)       return { ok: false, error: "Minimum withdrawal is Rs. 100." };

    const req = {
      id:            `WD-${Date.now()}`,
      sellerName, amount, method, accountNumber, accountName,
      status:        "pending",
      requestedAt:   new Date().toISOString(),
      processedAt:   null,
      adminNote:     "",
    };

    setWithdrawals(prev => [req, ...prev]);
    setWallets(prev => {
      const w = prev[sellerName] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
      return { ...prev, [sellerName]: { ...w, pending: (w.pending || 0) + amount } };
    });

    return { ok: true };
  };

  // ── Admin approves ──
  const approveWithdrawal = (withdrawalId, adminNote = "") => {
    const req = withdrawals.find(w => w.id === withdrawalId);
    if (!req) return;

    setWithdrawals(prev => prev.map(w =>
      w.id === withdrawalId ? { ...w, status: "approved", processedAt: new Date().toISOString(), adminNote } : w
    ));
    setWallets(prev => {
      const w = prev[req.sellerName] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
      return {
        ...prev,
        [req.sellerName]: {
          ...w,
          withdrawn: (w.withdrawn || 0) + req.amount,
          pending:   Math.max(0, (w.pending || 0) - req.amount),
        },
      };
    });
  };

  // ── Admin rejects ──
  const rejectWithdrawal = (withdrawalId, adminNote = "") => {
    const req = withdrawals.find(w => w.id === withdrawalId);
    if (!req) return;

    setWithdrawals(prev => prev.map(w =>
      w.id === withdrawalId ? { ...w, status: "rejected", processedAt: new Date().toISOString(), adminNote } : w
    ));
    setWallets(prev => {
      const w = prev[req.sellerName] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
      return { ...prev, [req.sellerName]: { ...w, pending: Math.max(0, (w.pending || 0) - req.amount) } };
    });
  };

  // ── Helpers ──
  const getWallet = (sellerName) => {
    const w = wallets[sellerName] || { totalEarned: 0, totalCommission: 0, withdrawn: 0, pending: 0 };
    return { ...w, available: Math.max(0, w.totalEarned - (w.withdrawn || 0) - (w.pending || 0)) };
  };

  const getSellerWithdrawals  = (sellerName) => withdrawals.filter(w => w.sellerName === sellerName);
  const pendingWithdrawals     = withdrawals.filter(w => w.status === "pending");

  return (
    <WalletContext.Provider value={{
      wallets, withdrawals, pendingWithdrawals,
      creditSeller, requestWithdrawal, approveWithdrawal, rejectWithdrawal,
      getWallet, getSellerWithdrawals, COMMISSION_RATE,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}