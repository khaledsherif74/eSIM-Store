import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LogOut,
  RefreshCw,
  Users,
  Settings,
  Package,
  Search,
  LayoutDashboard,
  KeyRound,
  Menu,
  X,
  Languages,
  ShoppingCart,
  UserPlus,
  Server,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { AdminBottomNav } from "../components/layout/AdminBottomNav.jsx";
import { statusMeta, formatDate } from "../utils/orderData.js";
import { adminApi } from "../services/adminApi.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./AdminDashboardPage.css";

const STATUS_OPTIONS = [
  "",
  "PendingPayment",
  "Authorized",
  "Creating",
  "Processing",
  "Completed",
  "PaymentFailed",
  "CaptureFailed",
  "FulfillmentFailedVoidFailed",
  "FulfillmentFailedRefundFailed",
  "Cancelled",
  "Refunded",
];

const NAV_ITEMS = [
  {
    id: "overview",
    labelKey: "admin.tab_dashboard",
    defaultLabel: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "orders",
    labelKey: "admin.tab_orders",
    defaultLabel: "Orders",
    icon: Package,
  },
  {
    id: "customers",
    labelKey: "admin.tab_customers",
    defaultLabel: "Customers",
    icon: Users,
  },
  {
    id: "sync",
    labelKey: "admin.tab_sync",
    defaultLabel: "Catalogue Sync",
    icon: RefreshCw,
  },
  {
    id: "config",
    labelKey: "admin.tab_configuration",
    defaultLabel: "Configuration",
    icon: Settings,
  },
  {
    id: "secrets",
    labelKey: "admin.tab_secrets",
    defaultLabel: "System Secrets",
    icon: KeyRound,
  },
];

const TRANSACTION_PURPOSE_LABELS = {
  Purchase: "Plan purchase",
  Topup: "Wallet top-up",
  ReferralReward: "Referral reward",
  Adjustment: "Manual adjustment",
};

const SECRET_LABELS = {
  MARKUP_PERCENT: "Markup Percent",
  REFERRAL_REWARD: "Referral Reward Amount",
  SYNC_INTERVAL_MINUTES: "Sync Interval (Minutes)",
  SYNC_ON_STARTUP: "Sync On Startup",
  MAX_DEACTIVATION_RATIO: "Max Deactivation Ratio",
  EXCHANGE_RATE_USD_TO_EGP: "Exchange Rate (USD to EGP)",
  MOBIMATTER_BASE_URL: "MobiMatter Base URL",
  MOBIMATTER_API_KEY: "MobiMatter API Key",
  MOBIMATTER_MERCHANT_ID: "MobiMatter Merchant ID",
  PAYMOB_API_KEY: "Paymob API Key",
  PAYMOB_INTEGRATION_ID: "Paymob Integration ID",
  PAYMOB_IFRAME_ID: "Paymob Iframe ID",
  PAYMOB_HMAC_SECRET: "Paymob HMAC Secret",
  PAYMOB_PUBLIC_KEY: "Paymob Public Key",
  PAYMOB_SECRET_KEY: "Paymob Secret Key",
  SMTP_HOST: "SMTP Host",
  SMTP_PORT: "SMTP Port",
  SMTP_USER: "SMTP User",
  SMTP_PASS: "SMTP Password",
  ADMIN_USERNAME: "Admin Username",
};

const SECRET_PLACEHOLDERS = {
  MARKUP_PERCENT: "e.g. 15",
  SYNC_INTERVAL_MINUTES: "e.g. 60",
  SYNC_ON_STARTUP: "true / false",
  MAX_DEACTIVATION_RATIO: "e.g. 0.1",
  EXCHANGE_RATE_USD_TO_EGP: "e.g. 48.50",
  MOBIMATTER_BASE_URL: "https://api.mobimatter.com",
  MOBIMATTER_API_KEY: "Your API Key",
  MOBIMATTER_MERCHANT_ID: "Your Merchant ID",
  PAYMOB_API_KEY: "Your Paymob API Key",
  PAYMOB_INTEGRATION_ID: "Your Integration ID",
  PAYMOB_IFRAME_ID: "Your Iframe ID",
  PAYMOB_HMAC_SECRET: "Your HMAC Secret",
  PAYMOB_PUBLIC_KEY: "Your Public Key",
  PAYMOB_SECRET_KEY: "Your Secret Key",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "email@example.com",
  SMTP_PASS: "Your App Password",
  ADMIN_USERNAME: "Admin Username",
};

function growthPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

const SERVICE_LABELS = {
  database: "Database",
  smtp: "SMTP",
  paymob: "Paymob",
  mobimatter: "MobiMatter",
};

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global search (local — filters a preloaded index)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState({ orders: [], customers: [] });
  const [searchIndexLoading, setSearchIndexLoading] = useState(false);
  const searchRef = useRef(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const pageSize = 25;

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Sync state
  const [syncMeta, setSyncMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Settings state
  const [settings, setSettings] = useState(null);
  const [markupInput, setMarkupInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const customerLimit = 25;

  // Customer history modal state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Secrets state
  const [secrets, setSecrets] = useState(null);
  const [editingSecret, setEditingSecret] = useState(null);
  const [savingSecret, setSavingSecret] = useState(null);

  // ---------- loaders ----------
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const result = await adminApi.listOrders({
        page: orderPage,
        pageSize,
        status: orderStatus,
      });
      setOrders(result.orders);
      setTotalOrders(result.total);
    } finally {
      setLoadingOrders(false);
    }
  }, [orderPage, orderStatus]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await adminApi.getStats());
    } catch (err) {
      console.error("[admin] stats load failed:", err);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadSyncStatus = useCallback(async () => {
    setSyncMeta(await adminApi.syncStatus());
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const result = await adminApi.listClients({
        page: customerPage,
        limit: customerLimit,
        q: customerSearch,
      });
      setCustomers(result.users);
      setTotalCustomers(result.total);
    } finally {
      setLoadingCustomers(false);
    }
  }, [customerPage, customerSearch]);

  const loadSecrets = useCallback(async () => {
    const data = await adminApi.getSecrets();
    setSecrets(data);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    loadStats();
    loadSyncStatus();
    adminApi.getSettings().then((s) => {
      setSettings(s);
      setMarkupInput(String(s.markupPercent ?? ""));
      setReferralInput(String(s.referralRewardAmount ?? ""));
    });
  }, [loadStats, loadSyncStatus]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setSearchIndexLoading(true);
      try {
        const [ordersRes, customersRes] = await Promise.all([
          adminApi.listOrders({ page: 1, pageSize: 1000 }),
          adminApi.listClients({ page: 1, limit: 1000 }),
        ]);
        if (!alive) return;
        setSearchIndex({
          orders: ordersRes.orders || [],
          customers: customersRes.users || [],
        });
      } catch (err) {
        console.error("[admin] search index load failed:", err);
      } finally {
        if (alive) setSearchIndexLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (activeSection === "customers") {
      loadCustomers();
    }
  }, [activeSection, loadCustomers]);

  useEffect(() => {
    if (activeSection === "secrets" || activeSection === "config")
      loadSecrets();
  }, [activeSection, loadSecrets]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { orders: [], customers: [] };

    const orders = searchIndex.orders
      .filter((o) => {
        const haystack = [
          o.orderId,
          o.productId,
          o.productTitle,
          o.mobimatterOrderId,
          o.customer?.email,
          o.customer?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 5);

    const customers = searchIndex.customers
      .filter((u) => {
        const haystack = [u.name, u.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 5);

    return { orders, customers };
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    function onDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function onSync() {
    setSyncing(true);
    const before = syncMeta?.lastAttemptAt;
    try {
      await adminApi.triggerSync();
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        const meta = await adminApi.syncStatus();
        if (meta.lastAttemptAt !== before || attempts >= 20) {
          setSyncMeta(meta);
          clearInterval(poll);
          setSyncing(false);
          loadStats();
        }
      }, 3000);
    } catch {
      setSyncing(false);
    }
  }

  async function onSaveMarkup() {
    setSavingSettings(true);
    try {
      const updated = await adminApi.updateSettings({
        markupPercent: Number(editingSecret?.value),
      });
      setSettings(updated);
      setMarkupInput(String(updated.markupPercent ?? ""));
    } finally {
      setSavingSettings(false);
      setEditingSecret(null);
    }
  }

  async function onSaveReferral() {
    setSavingSettings(true);
    try {
      const updated = await adminApi.updateSettings({
        referralRewardAmount: Number(editingSecret?.value),
      });
      setSettings(updated);
      setReferralInput(String(updated.referralRewardAmount ?? ""));
    } finally {
      setSavingSettings(false);
      setEditingSecret(null);
    }
  }

  async function onUpdateSecret(key, value) {
    setSavingSecret(key);
    try {
      await adminApi.updateSecret(key, value);
      await loadSecrets();
      loadStats();
    } finally {
      setSavingSecret(null);
      setEditingSecret(null);
    }
  }

  async function onLogout() {
    await adminApi.logout();
    navigate("/admin/login", { replace: true });
  }

  async function onSelectCustomer(userId) {
    setSelectedUserId(userId);
    setCustomerDetail(null);
    setLoadingDetail(true);
    try {
      const detail = await adminApi.getClientHistory(userId);
      setCustomerDetail(detail);
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeCustomerModal() {
    setSelectedUserId(null);
    setCustomerDetail(null);
  }

  function goSection(id) {
    setActiveSection(id);
    setSidebarOpen(false);
    closeCustomerModal();
  }

  function onPickOrderSearchResult() {
    goSection("orders");
    setSearchOpen(false);
    setSearchQuery("");
  }

  function onPickCustomerSearchResult(userId) {
    setActiveSection("customers");
    onSelectCustomer(userId);
    setSearchOpen(false);
    setSearchQuery("");
  }

  const orderTotalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const customerTotalPages = Math.max(
    1,
    Math.ceil(totalCustomers / customerLimit),
  );

  const showSearchDropdown = searchOpen && searchQuery.trim().length > 0;

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-mark">e</span>
            <div>
              <strong>eSIM Store</strong>
              <span>Admin Panel</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={onLogout}
            aria-label={t("admin.logout")}
            title={t("admin.logout")}
          >
            <LogOut size={16} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-item${activeSection === item.id ? " active" : ""}`}
                onClick={() => goSection(item.id)}
              >
                <Icon size={18} />
                <span>{t(item.labelKey, item.defaultLabel)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="admin-topbar-search-wrap" ref={searchRef}>
            <div className="admin-topbar-search">
              <Search size={16} />
              <input
                type="text"
                placeholder={t(
                  "admin.search_global",
                  "Search orders, customers…",
                )}
                aria-label="Search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
              />
              {searchIndexLoading && <Spinner size={14} />}
            </div>

            {showSearchDropdown && (
              <div className="admin-search-dropdown">
                {searchResults.orders.length > 0 && (
                  <div className="admin-search-group">
                    <span className="admin-search-group-label">
                      {t("admin.tab_orders", "Orders")}
                    </span>
                    {searchResults.orders.map((o) => (
                      <button
                        key={o.orderId}
                        type="button"
                        className="admin-search-result"
                        onClick={() => onPickOrderSearchResult(o.orderId)}
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

                {searchResults.customers.length > 0 && (
                  <div className="admin-search-group">
                    <span className="admin-search-group-label">
                      {t("admin.tab_customers", "Customers")}
                    </span>
                    {searchResults.customers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="admin-search-result"
                        onClick={() => onPickCustomerSearchResult(u.id)}
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

                {!searchIndexLoading &&
                  searchResults.orders.length === 0 &&
                  searchResults.customers.length === 0 &&
                  searchQuery.trim() && (
                    <div className="admin-search-empty">
                      {t("admin.search_no_results", "No results")}
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="admin-topbar-right">
            <button
              type="button"
              className="admin-lang-btn"
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              aria-label="Toggle language"
              title="Toggle language"
            >
              <Languages size={16} />
              <span>{language === "en" ? "العربية" : "English"}</span>
            </button>
          </div>
        </header>

        <main className="admin-content">
          {/* ---------------- OVERVIEW ---------------- */}
          {activeSection === "overview" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.dashboard_title", "Dashboard")}</h1>
                <p>
                  {t("admin.dashboard_sub", "Overview of your eSIM platform")}
                </p>
              </header>

              {statsLoading ? (
                <Spinner label="Loading stats…" />
              ) : !stats ? (
                <p className="empty-text">Stats unavailable.</p>
              ) : (
                <>
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <div className="admin-stat-icon icon-orders">
                        <ShoppingCart size={22} />
                      </div>
                      <div className="admin-stat-body">
                        <span className="admin-stat-label">
                          {t("admin.dashboard_status_orders")}
                        </span>
                        <div className="admin-stat-value">
                          {stats.orders.total}
                        </div>
                        <div className="admin-stat-delta">
                          {growthPct(
                            stats.orders.last7Days,
                            stats.orders.previous7Days,
                          ) >= 0 ? (
                            <TrendingUp size={13} className="delta-up" />
                          ) : (
                            <TrendingDown size={13} className="delta-down" />
                          )}
                          <span
                            className={
                              growthPct(
                                stats.orders.last7Days,
                                stats.orders.previous7Days,
                              ) >= 0
                                ? "delta-up"
                                : "delta-down"
                            }
                          >
                            {growthPct(
                              stats.orders.last7Days,
                              stats.orders.previous7Days,
                            )}
                            %
                          </span>
                          <span className="admin-stat-delta-sub">
                            +{stats.orders.last7Days} in last 7 days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon icon-customers">
                        <UserPlus size={22} />
                      </div>
                      <div className="admin-stat-body">
                        <span className="admin-stat-label">
                          {t("admin.dashboard_status_customers")}
                        </span>
                        <div className="admin-stat-value">
                          {stats.customers.total}
                        </div>
                        <div className="admin-stat-delta">
                          {growthPct(
                            stats.customers.last7Days,
                            stats.customers.previous7Days,
                          ) >= 0 ? (
                            <TrendingUp size={13} className="delta-up" />
                          ) : (
                            <TrendingDown size={13} className="delta-down" />
                          )}
                          <span
                            className={
                              growthPct(
                                stats.customers.last7Days,
                                stats.customers.previous7Days,
                              ) >= 0
                                ? "delta-up"
                                : "delta-down"
                            }
                          >
                            {growthPct(
                              stats.customers.last7Days,
                              stats.customers.previous7Days,
                            )}
                            %
                          </span>
                          <span className="admin-stat-delta-sub">
                            +{stats.customers.last7Days} in last 7 days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-stat-card">
                      <div className="admin-stat-icon icon-sync">
                        <RefreshCw size={22} />
                      </div>
                      <div className="admin-stat-body">
                        <span className="admin-stat-label">
                          {t("admin.dashboard_status_catalogue")}
                        </span>
                        <div className="admin-stat-value">
                          {stats.catalogue.activeProducts}
                        </div>
                        <div className="admin-stat-delta">
                          <span
                            className={
                              stats.sync.lastStatus === "success"
                                ? "status-dot dot-ok"
                                : stats.sync.lastStatus
                                  ? "status-dot dot-warn"
                                  : "status-dot dot-muted"
                            }
                          />
                          <span className="admin-stat-delta-sub">
                            {stats.sync.lastStatus === "success"
                              ? "Synced"
                              : stats.sync.lastStatus || "Never run"}
                            {stats.sync.lastSuccessAt
                              ? ` · ${formatDate(stats.sync.lastSuccessAt)}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-stat-card admin-stat-health">
                      <div className="admin-stat-icon icon-health">
                        <Server size={22} />
                      </div>
                      <div className="admin-stat-body">
                        <span className="admin-stat-label">
                          {t("admin.dashboard_status_health")}
                        </span>
                        <div className="admin-stat-value">
                          {Object.values(stats.health).filter(Boolean).length}/
                          {Object.keys(stats.health).length}
                        </div>
                        <div className="health-pills">
                          {Object.entries(stats.health).map(([key, ok]) => (
                            <span
                              key={key}
                              className={`health-pill ${ok ? "ok" : "down"}`}
                              title={
                                ok
                                  ? `${SERVICE_LABELS[key]} configured`
                                  : `${SERVICE_LABELS[key]} not configured`
                              }
                            >
                              {!ok && <AlertCircle size={11} />}
                              {SERVICE_LABELS[key]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="admin-recent-grid">
                    <Card className="admin-recent-card">
                      <div className="admin-recent-head">
                        <h2>
                          <Package size={16} />{" "}
                          {t("admin.dashboard_recent_orders")}
                        </h2>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => goSection("orders")}
                        >
                          {t("admin.dashboard_veiw_all")}
                        </button>
                      </div>
                      {orders.length === 0 ? (
                        <p className="empty-text">{t("admin.no_orders")}</p>
                      ) : (
                        <table className="admin-orders-table compact">
                          <thead>
                            <tr>
                              <th>
                                {t("admin.dashboard_recent_orders_table_c1")}
                              </th>
                              <th>
                                {t("admin.dashboard_recent_orders_table_c2")}
                              </th>
                              <th>
                                {t("admin.dashboard_recent_orders_table_c3")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((o) => {
                              const [label, tone] = statusMeta(o.status);
                              return (
                                <tr key={o.orderId}>
                                  <td className="mono">
                                    {o.orderId.length > 20
                                      ? `${o.orderId.slice(0, 18)}…`
                                      : o.orderId}
                                  </td>
                                  <td>{o.customer?.email || "—"}</td>
                                  <td>
                                    <Badge tone={tone}>{label}</Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </Card>

                    <Card className="admin-recent-card">
                      <div className="admin-recent-head">
                        <h2>
                          <Users size={16} />{" "}
                          {t("admin.dashboard_recent_customers")}
                        </h2>
                        <button
                          type="button"
                          className="admin-link-btn"
                          onClick={() => goSection("customers")}
                        >
                          {t("admin.dashboard_veiw_all")}
                        </button>
                      </div>
                      {searchIndex.customers.length === 0 ? (
                        <p className="empty-text">No customers yet.</p>
                      ) : (
                        <table className="admin-orders-table compact">
                          <thead>
                            <tr>
                              <th>
                                {t("admin.dashboard_recent_customers_table_c1")}
                              </th>
                              <th>
                                {t("admin.dashboard_recent_customers_table_c2")}
                              </th>
                              <th>
                                {t("admin.dashboard_recent_customers_table_c3")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchIndex.customers.slice(0, 5).map((u) => (
                              <tr
                                key={u.id}
                                className="clickable-row"
                                onClick={() => {
                                  setActiveSection("customers");
                                  onSelectCustomer(u.id);
                                }}
                              >
                                <td>{u.name || "—"}</td>
                                <td>{u.email}</td>
                                <td>{u._count?.orders || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </Card>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ---------------- ORDERS ---------------- */}
          {activeSection === "orders" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.orders_title")}</h1>
                <p>{t("admin.tab_orders_sub_title")}</p>
              </header>

              <div className="admin-orders-header">
                <select
                  value={orderStatus}
                  onChange={(e) => {
                    setOrderStatus(e.target.value);
                    setOrderPage(1);
                  }}
                >
                  <option value="">{t("admin.all_statuses")}</option>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {loadingOrders ? (
                <Spinner label={t("admin.loading_orders")} />
              ) : (
                <>
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.col_order_id")}</th>
                        <th>{t("admin.col_product")}</th>
                        <th>{t("admin.col_customer")}</th>
                        <th>{t("admin.col_price")}</th>
                        <th>{t("admin.col_status")}</th>
                        <th>{t("admin.col_updated")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => {
                        const [label, tone] = statusMeta(o.status);
                        return (
                          <tr key={o.orderId}>
                            <td className="mono">{o.orderId}</td>
                            <td>{o.productTitle || o.productId}</td>
                            <td>{o.customer?.email || "—"}</td>
                            <td>
                              {o.price != null
                                ? `E£${Number(o.price).toFixed(2)}`
                                : "—"}
                            </td>
                            <td>
                              <Badge tone={tone}>{label}</Badge>
                            </td>
                            <td>{formatDate(o.updatedAt)}</td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="admin-orders-empty">
                            {t("admin.no_orders")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="admin-pagination">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={orderPage <= 1}
                      onClick={() => setOrderPage((p) => p - 1)}
                    >
                      {t("admin.previous")}
                    </Button>
                    <span>
                      {t("admin.page_of", {
                        page: orderPage,
                        total: orderTotalPages,
                      })}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={orderPage >= orderTotalPages}
                      onClick={() => setOrderPage((p) => p + 1)}
                    >
                      {t("admin.next")}
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ---------------- CUSTOMERS ---------------- */}
          {activeSection === "customers" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.customers_title")}</h1>
                <p>{t("admin.tab_customers_sub_title")}</p>
              </header>

              <div className="admin-customers-header">
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder={t("admin.search_placeholder")}
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                  />
                </div>
              </div>

              {loadingCustomers ? (
                <Spinner label={t("admin.loading_customers")} />
              ) : (
                <>
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.col_name")}</th>
                        <th>{t("admin.col_email")}</th>
                        <th>{t("admin.col_balance")}</th>
                        <th>{t("admin.col_orders")}</th>
                        <th>{t("admin.col_action")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name || "—"}</td>
                          <td>{u.email}</td>
                          <td>${u.wallet?.balance?.toFixed(2) || "0.00"}</td>
                          <td>{u._count?.orders || 0}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onSelectCustomer(u.id)}
                            >
                              {t("admin.view_history")}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {customers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="admin-orders-empty">
                            {t("admin.no_customers")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="admin-pagination">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={customerPage <= 1}
                      onClick={() => setCustomerPage((p) => p - 1)}
                    >
                      {t("admin.previous")}
                    </Button>
                    <span>
                      {t("admin.page_of", {
                        page: customerPage,
                        total: customerTotalPages,
                      })}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={customerPage >= customerTotalPages}
                      onClick={() => setCustomerPage((p) => p + 1)}
                    >
                      {t("admin.next")}
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ---------------- CATALOGUE SYNC ---------------- */}
          {activeSection === "sync" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.tab_sync", "Catalogue Sync")}</h1>
                <p>{t("admin.sync_sub_title")}</p>
              </header>

              <Card className="admin-card">
                <h2 className="card-title">{t("admin.sync_title")}</h2>
                {syncMeta ? (
                  <dl className="admin-kv">
                    <dt>{t("admin.sync_last_status")}</dt>
                    <dd>{syncMeta.lastStatus || t("admin.sync_never_run")}</dd>
                    <dt>{t("admin.sync_last_attempt")}</dt>
                    <dd>
                      {syncMeta.lastAttemptAt
                        ? formatDate(syncMeta.lastAttemptAt)
                        : "—"}
                    </dd>
                    <dt>{t("admin.sync_last_success")}</dt>
                    <dd>
                      {syncMeta.lastSuccessAt
                        ? formatDate(syncMeta.lastSuccessAt)
                        : "—"}
                    </dd>
                    <dt>{t("admin.sync_products_fetched")}</dt>
                    <dd>{syncMeta.history?.[0]?.fetched ?? "—"}</dd>
                    {syncMeta.lastError && (
                      <>
                        <dt>{t("admin.sync_last_error")}</dt>
                        <dd className="admin-error-text">
                          {syncMeta.lastError}
                        </dd>
                      </>
                    )}
                  </dl>
                ) : (
                  <Spinner label={t("admin.sync_loading")} />
                )}
                <Button
                  icon={
                    <RefreshCw size={16} className={syncing ? "spin" : ""} />
                  }
                  onClick={onSync}
                  disabled={syncing}
                >
                  {syncing ? t("admin.syncing") : t("admin.sync_now")}
                </Button>
              </Card>
            </section>
          )}

          {/* ---------------- CONFIGURATION ---------------- */}
          {activeSection === "config" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.tab_configuration")}</h1>
                <p>{t("admin.config_note")}</p>
              </header>

              <Card className="admin-card">
                <h3 className="system-config-subhead">{t("admin.pricing")}</h3>
                <div className="secrets-list">
                  <SecretRow
                    t={t}
                    label="MARKUP_PERCENT"
                    value={`${markupInput}%`}
                    editing={editingSecret?.key === "MARKUP_PERCENT"}
                    editingValue={editingSecret?.value}
                    inputType="number"
                    onEdit={() =>
                      setEditingSecret({
                        key: "MARKUP_PERCENT",
                        value: markupInput,
                      })
                    }
                    onChange={(value) =>
                      setEditingSecret({ key: "MARKUP_PERCENT", value })
                    }
                    onCancel={() => setEditingSecret(null)}
                    onSave={onSaveMarkup}
                    saving={savingSettings}
                  />
                  <SecretRow
                    t={t}
                    label="REFERRAL_REWARD"
                    value={`${referralInput}`}
                    editing={editingSecret?.key === "REFERRAL_REWARD"}
                    editingValue={editingSecret?.value}
                    inputType="number"
                    onEdit={() =>
                      setEditingSecret({
                        key: "REFERRAL_REWARD",
                        value: referralInput,
                      })
                    }
                    onChange={(value) =>
                      setEditingSecret({ key: "REFERRAL_REWARD", value })
                    }
                    onCancel={() => setEditingSecret(null)}
                    onSave={onSaveReferral}
                    saving={savingSettings}
                  />
                </div>

                <h3 className="system-config-subhead">
                  {t("admin.sync_operations")}
                </h3>
                {secrets ? (
                  <div className="secrets-list">
                    {[
                      "SYNC_INTERVAL_MINUTES",
                      "SYNC_ON_STARTUP",
                      "MAX_DEACTIVATION_RATIO",
                      "EXCHANGE_RATE_USD_TO_EGP",
                    ].map((key) => (
                      <SecretRow
                        t={t}
                        key={key}
                        label={key}
                        value={secrets[key]}
                        editing={editingSecret?.key === key}
                        editingValue={editingSecret?.value}
                        onEdit={() => setEditingSecret({ key, value: "" })}
                        onChange={(value) => setEditingSecret({ key, value })}
                        onCancel={() => setEditingSecret(null)}
                        onSave={() => onUpdateSecret(key, editingSecret.value)}
                        saving={savingSecret === key}
                      />
                    ))}
                  </div>
                ) : (
                  <Spinner label={t("admin.sync_loading")} />
                )}
              </Card>
            </section>
          )}

          {/* ---------------- SECRETS ---------------- */}
          {activeSection === "secrets" && (
            <section className="admin-section">
              <header className="admin-section-head">
                <h1>{t("admin.tab_secrets", "System Secrets")}</h1>
                <p>{t("admin.config_note")}</p>
              </header>

              <div className="system-config-columns">
                <div className="system-config-column">
                  <h3 className="system-config-subhead">
                    {t("admin.mobimatter")}
                  </h3>
                  {secrets ? (
                    <div className="secrets-list">
                      {[
                        "MOBIMATTER_BASE_URL",
                        "MOBIMATTER_API_KEY",
                        "MOBIMATTER_MERCHANT_ID",
                      ].map((key) => (
                        <SecretRow
                          t={t}
                          key={key}
                          label={key}
                          value={secrets[key]}
                          editing={editingSecret?.key === key}
                          editingValue={editingSecret?.value}
                          onEdit={() => setEditingSecret({ key, value: "" })}
                          onChange={(value) => setEditingSecret({ key, value })}
                          onCancel={() => setEditingSecret(null)}
                          onSave={() =>
                            onUpdateSecret(key, editingSecret.value)
                          }
                          saving={savingSecret === key}
                        />
                      ))}
                    </div>
                  ) : (
                    <Spinner label={t("admin.sync_loading")} />
                  )}

                  <h3 className="system-config-subhead">{t("admin.paymob")}</h3>
                  {secrets ? (
                    <div className="secrets-list">
                      {[
                        "PAYMOB_API_KEY",
                        "PAYMOB_INTEGRATION_ID",
                        "PAYMOB_IFRAME_ID",
                        "PAYMOB_HMAC_SECRET",
                        "PAYMOB_PUBLIC_KEY",
                        "PAYMOB_SECRET_KEY",
                      ].map((key) => (
                        <SecretRow
                          t={t}
                          key={key}
                          label={key}
                          value={secrets[key]}
                          editing={editingSecret?.key === key}
                          editingValue={editingSecret?.value}
                          onEdit={() => setEditingSecret({ key, value: "" })}
                          onChange={(value) => setEditingSecret({ key, value })}
                          onCancel={() => setEditingSecret(null)}
                          onSave={() =>
                            onUpdateSecret(key, editingSecret.value)
                          }
                          saving={savingSecret === key}
                        />
                      ))}
                    </div>
                  ) : (
                    <Spinner label={t("admin.sync_loading")} />
                  )}
                </div>

                <div className="system-config-column">
                  <h3 className="system-config-subhead">{t("admin.smtp")}</h3>
                  {secrets ? (
                    <div className="secrets-list">
                      {["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].map(
                        (key) => (
                          <SecretRow
                            t={t}
                            key={key}
                            label={key}
                            value={secrets[key]}
                            editing={editingSecret?.key === key}
                            editingValue={editingSecret?.value}
                            onEdit={() => setEditingSecret({ key, value: "" })}
                            onChange={(value) =>
                              setEditingSecret({ key, value })
                            }
                            onCancel={() => setEditingSecret(null)}
                            onSave={() =>
                              onUpdateSecret(key, editingSecret.value)
                            }
                            saving={savingSecret === key}
                          />
                        ),
                      )}
                    </div>
                  ) : (
                    <Spinner label={t("admin.sync_loading")} />
                  )}

                  <h3 className="system-config-subhead">
                    {t("admin.admin_account")}
                  </h3>
                  {secrets ? (
                    <div className="secrets-list">
                      <SecretRow
                        t={t}
                        label="ADMIN_USERNAME"
                        value={secrets.ADMIN_USERNAME}
                        editing={editingSecret?.key === "ADMIN_USERNAME"}
                        editingValue={editingSecret?.value}
                        onEdit={() =>
                          setEditingSecret({ key: "ADMIN_USERNAME", value: "" })
                        }
                        onChange={(value) =>
                          setEditingSecret({ key: "ADMIN_USERNAME", value })
                        }
                        onCancel={() => setEditingSecret(null)}
                        onSave={() =>
                          onUpdateSecret("ADMIN_USERNAME", editingSecret.value)
                        }
                        saving={savingSecret === "ADMIN_USERNAME"}
                      />
                      <SecretRow
                        t={t}
                        label="Admin Password"
                        value={secrets.ADMIN_PASSWORD_HASH}
                        editing={editingSecret?.key === "ADMIN_PASSWORD_HASH"}
                        editingValue={editingSecret?.value}
                        inputType="password"
                        placeholder={t("admin.new_password_placeholder")}
                        onEdit={() =>
                          setEditingSecret({
                            key: "ADMIN_PASSWORD_HASH",
                            value: "",
                          })
                        }
                        onChange={(value) =>
                          setEditingSecret({
                            key: "ADMIN_PASSWORD_HASH",
                            value,
                          })
                        }
                        onCancel={() => setEditingSecret(null)}
                        onSave={() =>
                          onUpdateSecret(
                            "ADMIN_PASSWORD_HASH",
                            editingSecret.value,
                          )
                        }
                        saving={savingSecret === "ADMIN_PASSWORD_HASH"}
                      />
                    </div>
                  ) : (
                    <Spinner label={t("admin.sync_loading")} />
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <AdminBottomNav
        active={activeSection}
        onChange={goSection}
        onLogout={onLogout}
      />

      {/* Customer history modal */}
      {selectedUserId && (
        <CustomerHistoryModal
          t={t}
          loading={loadingDetail}
          detail={customerDetail}
          onClose={closeCustomerModal}
        />
      )}
    </div>
  );
}

function CustomerHistoryModal({ t, loading, detail, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-modal-close"
          onClick={onClose}
          aria-label={t("common.close", "Close")}
        >
          <X size={20} />
        </button>

        <div className="admin-modal-body">
          {loading ? (
            <Spinner label={t("admin.loading_customer_details")} />
          ) : !detail ? (
            <p className="empty-text">{t("admin.customer_not_found")}</p>
          ) : (
            <>
              <div className="customer-detail-header">
                <h1>{detail.name || "—"}</h1>
                <p>{detail.email}</p>
              </div>

              <div className="admin-dashboard-grid">
                <Card className="admin-card">
                  <h2>{t("admin.wallet_balance")}</h2>
                  <div className="balance-huge">
                    ${detail.wallet?.balance?.toFixed(2) || "0.00"}
                  </div>
                  <h3 className="section-title">{t("admin.transactions")}</h3>
                  <div className="admin-kv-list">
                    {detail.wallet?.transactions?.map((tx, i) => (
                      <div key={i} className="kv-item">
                        <span className="kv-label">
                          {formatDate(tx.createdAt)}
                        </span>
                        <span
                          className={`kv-value ${tx.type === "Credit" ? "text-success" : "text-danger"}`}
                        >
                          {tx.type === "Credit" ? "+" : "-"}$
                          {Number(tx.amount).toFixed(2)}
                        </span>
                        <span className="kv-desc">
                          {TRANSACTION_PURPOSE_LABELS[tx.purpose] || tx.purpose}
                        </span>
                      </div>
                    ))}
                    {(!detail.wallet?.transactions ||
                      detail.wallet.transactions.length === 0) && (
                      <p className="empty-text">{t("admin.no_transactions")}</p>
                    )}
                  </div>
                </Card>

                <Card className="admin-card">
                  <h2>{t("admin.order_history")}</h2>
                  <div className="admin-kv-list">
                    {detail.orders?.map((o, i) => {
                      const [label, tone] = statusMeta(o.status);
                      return (
                        <div key={i} className="kv-item">
                          <span className="kv-label">
                            {formatDate(o.createdAt)}
                          </span>
                          <Badge tone={tone}>{label}</Badge>
                          <span className="kv-desc">
                            {o.productTitle || o.productId} - E£
                            {Number(o.price).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                    {(!detail.orders || detail.orders.length === 0) && (
                      <p className="empty-text">
                        {t("admin.no_orders_for_customer")}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SecretRow({
  t,
  label,
  value,
  editing,
  editingValue,
  inputType = "text",
  placeholder,
  onEdit,
  onChange,
  onCancel,
  onSave,
  saving,
}) {
  const effectivePlaceholder =
    placeholder || SECRET_PLACEHOLDERS[label] || value || "";
  return (
    <div className="secret-item">
      <span className="secret-key">{SECRET_LABELS[label] || label}</span>
      {editing ? (
        <div className="secret-edit-input">
          <input
            type={inputType}
            value={editingValue}
            placeholder={effectivePlaceholder}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="secret-actions">
            <Button
              size="sm"
              variant="primary"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? t("admin.saving") : t("admin.save")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onCancel}>
              {t("admin.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="secret-value-box">
          <span className="masked-val">{value}</span>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            {t("admin.edit")}
          </Button>
        </div>
      )}
    </div>
  );
}
