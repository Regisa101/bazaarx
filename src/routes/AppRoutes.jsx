import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../modules/auth/hooks/useAuth";

// Buyer pages
import BuyerHome from "../modules/buyer/pages/BuyerHome";
import ProductDetails from "../modules/buyer/pages/ProductDetails";
import Checkout from "../modules/buyer/pages/Checkout";
import OrderConfirmation from "../modules/buyer/pages/OrderConfirmation";
import OrderHistory from "../modules/buyer/pages/OrderHistory";

// Cart
import Cart from "../modules/cart/components/Cart";

// Auth pages
import Login from "../modules/auth/components/Login";
import Signup from "../modules/auth/components/Signup";

// Seller pages
import StoreSetup from "../modules/seller/pages/StoreSetup";
import PaymentSetup from "../modules/seller/pages/PaymentSetup";
import SellerDashboard from "../modules/seller/pages/SellerDashboard";
import AddProduct from "../modules/seller/pages/AddProduct";
import MyProducts from "../modules/seller/pages/MyProducts";
import SellerOrders from "../modules/seller/pages/SellerOrders";
import SellerWallet from "../modules/seller/pages/SellerWallet";

// Admin pages
import AdminDashboard from "../modules/admin/pages/AdminDashboard";
import ManageProducts from "../modules/admin/pages/ManageProducts";
import ManageUsers from "../modules/admin/pages/ManageUsers";

function BuyerRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function SellerRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login?redirect=seller" replace />;
  }

  if (user.role !== "seller" && user.role !== "admin") {
    return <Navigate to="/buyer" replace />;
  }

  if (user.role === "seller") {
    if (!user.storeSetupDone) {
      return <Navigate to="/seller/setup/store" replace />;
    }

    if (!user.paymentSetupDone) {
      return <Navigate to="/seller/setup/payment" replace />;
    }
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login?redirect=admin" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/buyer" replace />;
  }

  return children;
}

function SetupRoute({ children }) {
  const { user } = useAuth();

  if (!user || user.role !== "seller") {
    return <Navigate to="/login" replace />;
  }

  if (!user.approved) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/buyer" replace />}
      />

      <Route
        path="/buyer"
        element={<BuyerHome />}
      />

      <Route
        path="/buyer/product/:id"
        element={<ProductDetails />}
      />

      <Route
        path="/buyer/cart"
        element={<Cart />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/signup"
        element={<Signup />}
      />

      <Route
        path="/buyer/checkout"
        element={
          <BuyerRoute>
            <Checkout />
          </BuyerRoute>
        }
      />

      <Route
        path="/buyer/order-confirmation/:orderId"
        element={
          <BuyerRoute>
            <OrderConfirmation />
          </BuyerRoute>
        }
      />

      <Route
        path="/buyer/orders"
        element={
          <BuyerRoute>
            <OrderHistory />
          </BuyerRoute>
        }
      />

      <Route
        path="/seller/setup/store"
        element={
          <SetupRoute>
            <StoreSetup />
          </SetupRoute>
        }
      />

      <Route
        path="/seller/setup/payment"
        element={
          <SetupRoute>
            <PaymentSetup />
          </SetupRoute>
        }
      />

      <Route
        path="/seller"
        element={
          <SellerRoute>
            <SellerDashboard />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/add"
        element={
          <SellerRoute>
            <AddProduct />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/products"
        element={
          <SellerRoute>
            <MyProducts />
          </SellerRoute>
        }
      />

      <Route
        path="/seller/orders"
        element={
          <SellerRoute>
            <SellerOrders />
          </SellerRoute>
        }
      />

      {/* Seller Wallet Route */}
      <Route
        path="/seller/wallet"
        element={
          <SellerRoute>
            <SellerWallet />
          </SellerRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/products"
        element={
          <AdminRoute>
            <ManageProducts />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        }
      />
    </Routes>
  );
}