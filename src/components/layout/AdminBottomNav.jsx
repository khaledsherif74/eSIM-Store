import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./AdminBottomNav.css";

export function AdminBottomNav({ items }) {
  const { t } = useTranslation();

  return (
    <nav className="admin-bottom-nav" aria-label="Admin navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <span key={item.id} style={{ display: "contents" }}>
            {item.separated && (
              <span className="admin-bottom-nav-sep" aria-hidden="true" />
            )}
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-bottom-nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon size={20} />
              <span>{t(item.labelKey, item.defaultLabel)}</span>
            </NavLink>
          </span>
        );
      })}
    </nav>
  );
}
