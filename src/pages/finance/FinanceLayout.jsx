import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  BarChart3,
  Landmark,
  LayoutDashboard,
  Receipt,
  ScrollText,
  ShoppingCart,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { AdminShell } from "../../components/admin/AdminShell.jsx";
import { useAdminSession } from "../../components/admin/AdminSessionContext.jsx";
import logo from "../../public/images/logo.png";

const FINANCE_NAV = [
  {
    id: "dashboard",
    to: "/finance",
    end: true,
    labelKey: "finance.nav.dashboard",
    defaultLabel: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "expenses",
    to: "/finance/expenses",
    labelKey: "finance.nav.expenses",
    defaultLabel: "Expenses",
    icon: Receipt,
  },
  {
    id: "reports",
    to: "/finance/reports",
    labelKey: "finance.nav.reports",
    defaultLabel: "Reports",
    icon: BarChart3,
  },
  {
    id: "supplier",
    to: "/finance/supplier",
    labelKey: "finance.nav.supplier",
    defaultLabel: "Supplier balance",
    icon: Wallet,
  },
  {
    id: "cashflow",
    to: "/finance/cashflow",
    labelKey: "finance.nav.cashflow",
    defaultLabel: "Cash flow",
    icon: ArrowLeftRight,
  },
  {
    id: "balances",
    to: "/finance/balances",
    labelKey: "finance.nav.balances",
    defaultLabel: "Balances",
    icon: Landmark,
  },
  {
    id: "orders",
    to: "/finance/orders",
    labelKey: "finance.nav.orders",
    defaultLabel: "Orders",
    icon: ShoppingCart,
  },
  {
    id: "settings",
    to: "/finance/settings",
    labelKey: "finance.nav.settings",
    defaultLabel: "Settings & audit",
    icon: ScrollText,
  },
];

export function FinanceLayout() {
  const { t } = useTranslation();
  const { role } = useAdminSession();
  const navItems = useMemo(() => FINANCE_NAV, []);
  return (
    <AdminShell
      brand={{
        title: t("finance.brand", "Finance"),
        subtitle: t("finance.brand_sub", "Financial management"),
        mark: logo,
      }}
      navItems={navItems}
      search={{
        includeUsers: false,
        orderPath: "/finance/orders",
        userPath: () => "/finance",
      }}
      extra={
        role === "Admin" ? (
          <Link
            to="/admin"
            className="ash-chip"
            style={{ textDecoration: "none" }}
          >
            <ArrowRight size={16} />
            <span>{t("finance.back_to_admin", "Back to admin")}</span>
          </Link>
        ) : null
      }
    />
  );
}
