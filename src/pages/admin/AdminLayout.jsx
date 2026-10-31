import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Gift,
  Landmark,
  LayoutDashboard,
  Package,
  Server,
  Tag,
  Users,
} from "lucide-react";
import { AdminShell } from "../../components/admin/AdminShell.jsx";
import { useAdminSession } from "../../components/admin/AdminSessionContext.jsx";
import logo from "../../public/images/logo.png";

const ADMIN_NAV = [
  {
    id: "overview",
    to: "/admin",
    end: true,
    labelKey: "admin.nav.overview",
    defaultLabel: "Dashboard",
    icon: LayoutDashboard,
    roles: ["Admin"],
  },
  {
    id: "products",
    to: "/admin/products",
    labelKey: "admin.nav.products",
    defaultLabel: "Products",
    icon: Package,
    roles: ["Admin", "Operator"],
  },
  {
    id: "coupons",
    to: "/admin/coupons",
    labelKey: "admin.nav.coupons",
    defaultLabel: "Coupons",
    icon: Tag,
    roles: ["Admin"],
  },
  {
    id: "users",
    to: "/admin/users",
    labelKey: "admin.nav.users",
    defaultLabel: "Clients",
    icon: Users,
    roles: ["Admin"],
  },
  {
    id: "referrals",
    to: "/admin/referrals",
    labelKey: "admin.nav.referrals",
    defaultLabel: "Referrals",
    icon: Gift,
    roles: ["Admin", "Operator"],
  },
  {
    id: "operations",
    to: "/admin/operations",
    labelKey: "admin.nav.operations",
    defaultLabel: "Operations",
    icon: Server,
    roles: ["Admin", "Support"],
  },
  {
    id: "finance",
    to: "/finance",
    labelKey: "admin.nav.finance",
    defaultLabel: "Finance",
    icon: Landmark,
    roles: ["Admin"],
    separated: true,
  },
];

export function AdminLayout() {
  const { t } = useTranslation();
  const { role } = useAdminSession();
  const navItems = useMemo(
    () => ADMIN_NAV.filter((i) => i.roles.includes(role)),
    [role],
  );
  return (
    <AdminShell
      brand={{
        title: "Dashboard",
        subtitle: t(
          "admin.brand_tagline",
          "Complete management for your online business",
        ),
        mark: logo,
      }}
      navItems={navItems}
      search={
        role === "Operator"
          ? null
          : {
              includeUsers: role === "Admin",
              orderPath: "/admin/operations?tab=orders",
              userPath: (id) => `/admin/users/${id}`,
            }
      }
    />
  );
}
