import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const SESSION_DURATION = 24 * 60 * 60 * 1000;
const PLATFORM_COMMISSION = 10; // Admin earns 10% from every sale

const INITIAL_USERS = [
  {
    id: 1, name: "Admin User", email: "admin@bazaarx.com",
    password: "admin123", role: "admin", approved: true,
    status: "active", joinedAt: "2024-01-01",
    phone: "9800000001", loginCount: 0, flagged: false, failedLogins: 0,
  },
  {
    id: 2, name: "Ram Bahadur", email: "seller@bazaarx.com",
    password: "seller123", role: "seller", approved: true,
    status: "active", joinedAt: "2024-06-01",
    phone: "9800000002", city: "Kathmandu", province: "Bagmati",
    shopName: "Ram's Crafts",
    businessName: "Ram's Crafts",
    businessAddress: "Thamel, Kathmandu",
    businessType: "Handicrafts",
    nidNumber: "12345678",
    businessDescription: "Authentic Nepali handicrafts and souvenirs.",
    // Store setup already done for demo seller
    storeSetupDone: true,
    paymentSetupDone: true,
    store: {
      shopName: "Ram's Crafts",
      street: "Thamel, Ward 26",
      city: "Kathmandu",
      province: "Bagmati",
      zipCode: "44600",
      phone: "9800000002",
    },
    payout: {
      method: "esewa",
      accountNumber: "9800000002",
      accountName: "Ram Bahadur",
    },
    commissionRate: PLATFORM_COMMISSION,
    loginCount: 0, flagged: false, failedLogins: 0,
  },
  {
    id: 3, name: "Aarav Sharma", email: "buyer@bazaarx.com",
    password: "buyer123", role: "buyer", approved: true,
    status: "active", joinedAt: "2024-08-01",
    phone: "9800000003", province: "Bagmati",
    city: "Kathmandu", area: "Baneshwor",
    loginCount: 0, flagged: false, failedLogins: 0,
  },
];

const loadUsers = () => {
  try {
    const s = localStorage.getItem("bazaarx_users");
    return s ? JSON.parse(s) : INITIAL_USERS;
  } catch { return INITIAL_USERS; }
};

const loadSession = () => {
  try {
    const s = localStorage.getItem("bazaarx_session");
    if (!s) return null;
    const { user, expiresAt } = JSON.parse(s);
    if (Date.now() > expiresAt) { localStorage.removeItem("bazaarx_session"); return null; }
    return user;
  } catch { return null; }
};

export const COMMISSION_RATE = PLATFORM_COMMISSION;

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [user, setUser]   = useState(loadSession);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("bazaarx_users", JSON.stringify(users));
  }, [users]);

  const saveSession = (u) => {
    const expiresAt = Date.now() + SESSION_DURATION;
    localStorage.setItem("bazaarx_session", JSON.stringify({ user: u, expiresAt }));
  };

  const login = (email, password) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) {
      if (found) {
        setUsers(prev => prev.map(u => {
          if (u.id !== found.id) return u;
          const failedLogins = (u.failedLogins || 0) + 1;
          return {
            ...u, failedLogins,
            flagged: failedLogins >= 5,
            status: failedLogins >= 10 ? "suspended" : u.status,
          };
        }));
      }
      setError("Invalid email or password.");
      return false;
    }
    if (found.role === "seller" && !found.approved) {
      setError("Your seller account is pending admin approval.");
      return false;
    }
    if (found.status === "suspended") {
      setError("Your account has been suspended. Contact support@bazaarx.com.np");
      return false;
    }
    const updatedUser = { ...found, loginCount: (found.loginCount || 0) + 1, failedLogins: 0 };
    setUsers(prev => prev.map(u => u.id === found.id ? updatedUser : u));
    setUser(updatedUser);
    setError("");
    saveSession(updatedUser);
    return updatedUser;
  };

  const signupBuyer = ({ name, email, password, phone, province, city, area }) => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) { setError("An account with this email already exists."); return false; }
    const newUser = {
      id: Date.now(), name, email, password, phone,
      province, city, area, role: "buyer",
      approved: true, status: "active",
      joinedAt: new Date().toISOString().split("T")[0],
      loginCount: 1, flagged: false, failedLogins: 0,
    };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    setError("");
    saveSession(newUser);
    return newUser;
  };

  const signupSeller = ({ name, email, password, phone, shopName, province, city, nidNumber, businessType, businessDescription }) => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) { setError("An account with this email already exists."); return false; }
    const newUser = {
      id: Date.now(), name, email, password, phone,
      shopName, province, city, nidNumber, businessType, businessDescription,
      businessName: shopName,
      businessAddress: city,
      role: "seller", approved: false, status: "active",
      joinedAt: new Date().toISOString().split("T")[0],
      storeSetupDone: false,
      paymentSetupDone: false,
      commissionRate: PLATFORM_COMMISSION,
      loginCount: 0, flagged: false, failedLogins: 0,
    };
    setUsers(prev => [...prev, newUser]);
    setError("");
    return newUser;
  };

  const completeStoreSetup = (setupData) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== user?.id) return u;
      return { ...u, store: setupData, storeSetupDone: true };
    }));
    const updated = { ...user, store: setupData, storeSetupDone: true };
    setUser(updated);
    saveSession(updated);
  };

  const completePaymentSetup = (payoutData) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== user?.id) return u;
      return { ...u, payout: payoutData, paymentSetupDone: true };
    }));
    const updated = { ...user, payout: payoutData, paymentSetupDone: true };
    setUser(updated);
    saveSession(updated);
  };

  const approveSeller = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u));
  const rejectSeller  = (id) => setUsers(prev => prev.filter(u => u.id !== id));
  const suspendUser   = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "suspended" } : u));
    if (user?.id === id) logout();
  };
  const activateUser = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, status: "active", flagged: false, failedLogins: 0 } : u));
  const logout = () => { setUser(null); localStorage.removeItem("bazaarx_session"); };

  const pendingSellers = users.filter(u => u.role === "seller" && !u.approved && u.status !== "suspended");
  const flaggedUsers   = users.filter(u => u.flagged && u.status !== "suspended");

  return (
    <AuthContext.Provider value={{
      user, users, login, logout,
      signupBuyer, signupSeller, error, setError,
      approveSeller, rejectSeller, suspendUser, activateUser,
      pendingSellers, flaggedUsers,
      completeStoreSetup, completePaymentSetup,
      COMMISSION_RATE,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}