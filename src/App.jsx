import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./modules/auth/context/AuthContext";
import { ProductProvider } from "./modules/products/context/ProductContext";
import { CartProvider } from "./modules/cart/context/CartContext";
import { OrderProvider } from "./modules/orders/context/OrderContext";
import { CouponProvider } from "./modules/orders/context/CouponContext";
import { WalletProvider } from "./modules/wallet/context/WalletContext";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <CouponProvider>
              <OrderProvider>
                <WalletProvider>
                  <AppRoutes />
                </WalletProvider>
              </OrderProvider>
            </CouponProvider>
          </ProductProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}