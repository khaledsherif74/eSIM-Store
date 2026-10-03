import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  KeyRound,
  LogOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import "./AdminBottomNav.css";

const ITEMS = [
  {
    id: "overview",
    icon: LayoutDashboard,
    labelKey: "admin.tab_dashboard",
    defaultLabel: "Home",
  },
  {
    id: "orders",
    icon: Package,
    labelKey: "admin.tab_orders",
    defaultLabel: "Orders",
  },
  {
    id: "customers",
    icon: Users,
    labelKey: "admin.tab_customers",
    defaultLabel: "Customers",
  },
  {
    id: "config",
    icon: Settings,
    labelKey: "admin.tab_configuration",
    defaultLabel: "Config",
  },
  {
    id: "secrets",
    icon: KeyRound,
    labelKey: "admin.tab_secrets",
    defaultLabel: "Secrets",
  },
];

export function AdminBottomNav({ active, onChange, onLogout }) {
  const { t } = useTranslation();

  return (
    <nav className="admin-bottom-nav" aria-label="Admin navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`admin-bottom-nav-item${active === item.id ? " active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <Icon size={20} />
            <span>{t(item.labelKey, item.defaultLabel)}</span>
          </button>
        );
      })}

      {onLogout && (
        <button
          type="button"
          className="admin-bottom-nav-item admin-bottom-nav-logout"
          onClick={onLogout}
          aria-label={t("admin.logout")}
        >
          <LogOut size={20} />
          <span>{t("admin.logout", "Logout")}</span>
        </button>
      )}
    </nav>
  );
}
