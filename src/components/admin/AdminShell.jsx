import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Languages,
  LogOut,
  Menu,
  Package,
  Search,
  Users,
  X,
} from "lucide-react";
import { Spinner } from "../ui/Spinner.jsx";
import { AdminBottomNav } from "../layout/AdminBottomNav.jsx";
import { adminApi } from "../../services/adminApi.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { useAdminSession } from "./AdminSessionContext.jsx";
import "./admin-tokens.css";
import "./AdminShell.css";
import "./adminContent.css";

function GlobalSearch({ config }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState({ orders: [], users: [] });
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const o = await adminApi.listOrders({ page: 1, pageSize: 100 });
        if (alive) setIndex((cur) => ({ ...cur, orders: o.orders || [] }));
      } catch (err) {
        console.error("[admin] search index failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!config.includeUsers || q.length < 2) {
      setIndex((cur) => (cur.users.length ? { ...cur, users: [] } : cur));
      return undefined;
    }
    let alive = true;
    const id = setTimeout(async () => {
      try {
        const r = await adminApi.listCustomers({ q });
        if (alive) setIndex((cur) => ({ ...cur, users: r.items || [] }));
      } catch (err) {
        console.error("[admin] user search failed:", err);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [query, config.includeUsers]);

  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { orders: [], users: [] };
    const has = (parts) =>
      parts.filter(Boolean).join(" ").toLowerCase().includes(q);
    return {
      orders: index.orders
        .filter((o) =>
          has([
            o.orderId,
            o.productId,
            o.productTitle,
            o.mobimatterOrderId,
            o.customer?.email,
            o.customer?.name,
          ]),
        )
        .slice(0, 5),
      users: index.users.slice(0, 5),
    };
  }, [query, index]);

  const pick = (to) => {
    navigate(to);
    setOpen(false);
    setQuery("");
  };
  const show = open && query.trim().length > 0;
  const none = !results.orders.length && !results.users.length;

  return (
    <div className="ash-search-wrap" ref={wrapRef}>
      <div className="ash-search">
        <Search size={16} />
        <input
          type="text"
          value={query}
          aria-label="Search"
          placeholder={t("admin.search_global", "Search orders, customers…")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {loading && <Spinner size={14} />}
      </div>
      {show && (
        <div className="ash-dropdown">
          {results.orders.length > 0 && (
            <div>
              <span className="ash-dd-label">
                {t("admin.tab_orders", "Orders")}
              </span>
              {results.orders.map((o) => (
                <button
                  key={o.orderId}
                  type="button"
                  className="ash-dd-item"
                  onClick={() => pick(config.orderPath)}
                >
                  <Package size={14} />
                  <div>
                    <strong>{o.productTitle || o.productId}</strong>
                    <span>
                      {o.orderId}
                      {o.customer?.email ? ` · ${o.customer.email}` : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {results.users.length > 0 && (
            <div>
              <span className="ash-dd-label">
                {t("admin.nav.users", "Users")}
              </span>
              {results.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="ash-dd-item"
                  onClick={() => pick(config.userPath(u.id))}
                >
                  <Users size={14} />
                  <div>
                    <strong>{u.name || u.email}</strong>
                    <span>{u.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loading && none && (
            <div className="ash-dd-empty">
              {t("admin.search_no_results", "No results")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminShell({ brand, navItems, search, extra }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const session = useAdminSession();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    try {
      await adminApi.logout();
    } finally {
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <div className="ash">
      <header className="ash-top">
        <button
          type="button"
          className="ash-menu-btn"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="ash-brand">
          <img src={brand.mark} className="ash-mark" />
          <div className="ash-brand-text">
            <strong>{brand.title}</strong>
            <span>{brand.subtitle}</span>
          </div>
        </div>
        {search && <GlobalSearch config={search} />}
        <div className="ash-top-right">
          {extra}
          <button
            type="button"
            className="ash-chip"
            aria-label="Toggle language"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          >
            <Languages size={16} />
            <span>{language === "en" ? "العربية" : "English"}</span>
          </button>
          <div className="ash-user">
            <strong>{session.username}</strong>
            <span>{t(`admin.finance.role_${session.role}`, session.role)}</span>
          </div>
          <button
            type="button"
            className="ash-chip"
            aria-label={t("admin.logout")}
            title={t("admin.logout")}
            onClick={onLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="ash-body">
        <aside className={`ash-side${open ? " open" : ""}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <span key={item.id} style={{ display: "contents" }}>
                {item.separated && <hr className="ash-nav-sep" />}
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `ash-nav-item${isActive ? " active" : ""}`
                  }
                  onClick={() => setOpen(false)}
                >
                  <Icon size={19} />
                  <span>{t(item.labelKey, item.defaultLabel)}</span>
                </NavLink>
              </span>
            );
          })}
        </aside>
        {open && <div className="ash-scrim" onClick={() => setOpen(false)} />}
        <main className="ash-content">
          <Outlet />
        </main>
      </div>

      <AdminBottomNav
        items={navItems.filter((item) => item.id !== "finance")}
      />
    </div>
  );
}
