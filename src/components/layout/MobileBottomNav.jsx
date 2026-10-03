import { NavLink } from "react-router-dom";
import { Home, Smartphone, HelpCircle, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth.jsx";
import "./MobileBottomNav.css";

export function MobileBottomNav() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) return null;

  const items = user
    ? [
        { to: "/", icon: Home, label: t("nav.home"), end: true },
        { to: "/my-esims", icon: Smartphone, label: t("nav.my_esim") },
        { to: "/help", icon: HelpCircle, label: t("nav.help") },
        { to: "/profile", icon: User, label: t("nav.profile") },
      ]
    : [
        { to: "/", icon: Home, label: t("nav.home"), end: true },
        { to: "/help", icon: HelpCircle, label: t("nav.help") },
        { to: "/auth?tab=login", icon: LogIn, label: t("common.login") },
      ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isAuthLink = item.to.startsWith("/auth");

        if (isAuthLink) {
          return (
            <a key={item.to} href={item.to} className="mobile-bottom-nav-item">
              <Icon size={20} />
              <span>{item.label}</span>
            </a>
          );
        }

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `mobile-bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
