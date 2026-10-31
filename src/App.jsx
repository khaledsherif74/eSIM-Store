import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar.jsx";
import { Footer } from "./components/layout/Footer.jsx";
import { MobileBottomNav } from "./components/layout/MobileBottomNav.jsx";
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
import { AdminLayout } from "./pages/admin/AdminLayout.jsx";
import { OverviewPage } from "./pages/admin/OverviewPage.jsx";
import { ProductsPage } from "./pages/admin/ProductsPage.jsx";
import { UsersPage } from "./pages/admin/UsersPage.jsx";
import { UserDetailPage } from "./pages/admin/UserDetailPage.jsx";
import { OperationsPage } from "./pages/admin/OperationsPage.jsx";
import { CouponsPage } from "./pages/admin/CouponsPage.jsx";
import { ReferralsPage } from "./pages/admin/ReferralsPage.jsx";
import { FinanceLayout } from "./pages/finance/FinanceLayout.jsx";
import {
  FinanceDashboardPage,
  FinanceExpensesPage,
  FinanceReportsPage,
  FinanceSupplierPage,
  FinanceCashflowPage,
  FinanceBalancesPage,
  FinanceOrdersPage,
  FinanceSettingsPage,
} from "./pages/finance/FinancePages.jsx";
import { AdminForgotPasswordPage } from "./pages/AdminForgotPasswordPage.jsx";
import { AdminResetPasswordPage } from "./pages/AdminResetPasswordPage.jsx";
import {
  RequireAdminSession,
  RoleGate,
} from "./components/RequireAdminSession.jsx";
import { NotFoundPage } from "./pages/NotFoundPage.jsx";
import { AuthPage } from "./pages/auth/AuthPage.jsx";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { CurrencyProvider } from "./i18n/CurrencyContext.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { SiteInfoProvider } from "./hooks/useSiteInfo.jsx";

function ShellRoutes() {
  return (
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
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

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
          <RequireAdminSession allow={["Admin", "Support", "Operator"]}>
            <AdminLayout />
          </RequireAdminSession>
        }
      >
        <Route
          index
          element={
            <RoleGate allow={["Admin"]}>
              <OverviewPage />
            </RoleGate>
          }
        />
        <Route
          path="products"
          element={
            <RoleGate allow={["Admin", "Operator"]}>
              <ProductsPage />
            </RoleGate>
          }
        />
        <Route
          path="coupons"
          element={
            <RoleGate allow={["Admin"]}>
              <CouponsPage />
            </RoleGate>
          }
        />
        <Route
          path="users"
          element={
            <RoleGate allow={["Admin"]}>
              <UsersPage />
            </RoleGate>
          }
        />
        <Route
          path="users/:id"
          element={
            <RoleGate allow={["Admin"]}>
              <UserDetailPage />
            </RoleGate>
          }
        />
        <Route
          path="referrals"
          element={
            <RoleGate allow={["Admin", "Operator"]}>
              <ReferralsPage />
            </RoleGate>
          }
        />
        <Route
          path="operations"
          element={
            <RoleGate allow={["Admin", "Support"]}>
              <OperationsPage />
            </RoleGate>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/finance"
        element={
          <RequireAdminSession allow={["Admin", "Accountant"]}>
            <FinanceLayout />
          </RequireAdminSession>
        }
      >
        <Route index element={<FinanceDashboardPage />} />
        <Route path="expenses" element={<FinanceExpensesPage />} />
        <Route path="reports" element={<FinanceReportsPage />} />
        <Route path="supplier" element={<FinanceSupplierPage />} />
        <Route path="cashflow" element={<FinanceCashflowPage />} />
        <Route path="balances" element={<FinanceBalancesPage />} />
        <Route path="orders" element={<FinanceOrdersPage />} />
        <Route path="settings" element={<FinanceSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function AppShell() {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/finance");

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>
        <ShellRoutes />
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
    </>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true }}>
            <SiteInfoProvider>
              <AppShell />
            </SiteInfoProvider>
          </BrowserRouter>
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}
