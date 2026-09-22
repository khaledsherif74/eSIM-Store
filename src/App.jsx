import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { PlanDetailsPage } from "./pages/PlanDetailsPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { OrderStatusPage } from "./pages/OrderStatusPage.jsx";
import { MyEsimsPage } from "./pages/MyEsimsPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";
import { EsimDetailsPage } from "./pages/EsimDetailsPage.jsx";
import { RelatedPurchasePage } from "./pages/RelatedPurchasePage.jsx";
import { InstallationPage } from "./pages/InstallationPage.jsx";
import { CompatibilityPage } from "./pages/CompatibilityPage.jsx";
import { FaqPage } from "./pages/FaqPage.jsx";
import { HelpPage } from "./pages/HelpPage.jsx";
import { AdminLoginPage } from "./pages/AdminLoginPage.jsx";
import { AdminDashboardPage } from "./pages/AdminDashboardPage.jsx";
import { AdminForgotPasswordPage } from "./pages/AdminForgotPasswordPage.jsx";
import { AdminResetPasswordPage } from "./pages/AdminResetPasswordPage.jsx";
import { RequireAdminSession } from "./components/RequireAdminSession.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { AuthPage } from "./pages/auth/AuthPage.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";

function AppShell() {
  return (
    <BrowserRouter future={{ v7_startTransition: true }}>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plans/:productId" element={<PlanDetailsPage />} />
          <Route path="/checkout/:productId" element={<CheckoutPage />} />
          <Route path="/order-status" element={<OrderStatusPage />} />
          <Route path="/my-esims" element={<MyEsimsPage />} />
          <Route path="/my-esims/:orderId" element={<EsimDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route
            path="/top-up/:orderId"
            element={<RelatedPurchasePage mode="topup" />}
          />
          <Route
            path="/replace/:orderId"
            element={<RelatedPurchasePage mode="replace" />}
          />
          <Route path="/installation" element={<InstallationPage />} />
          <Route path="/compatibility" element={<CompatibilityPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/forgot-password"
            element={<AdminForgotPasswordPage />}
          />
          <Route
            path="/admin/reset-password"
            element={<AdminResetPasswordPage />}
          />
          <Route
            path="/admin"
            element={
              <RequireAdminSession>
                <AdminDashboardPage />
              </RequireAdminSession>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </LanguageProvider>
  );
}
