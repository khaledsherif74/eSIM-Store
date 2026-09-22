import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LogOut,
  RefreshCw,
  Users,
  Settings,
  Package,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { statusMeta, formatDate } from "../utils/orderData.js";
import { adminApi } from "../services/adminApi.js";
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

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const pageSize = 25;

  // Sync State
  const [syncMeta, setSyncMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Settings State
  const [settings, setSettings] = useState(null);
  const [markupInput, setMarkupInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Customers State
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const customerLimit = 25;

  // Customer Detail State
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Secrets State
  const [secrets, setSecrets] = useState(null);
  const [editingSecret, setEditingSecret] = useState(null); // { key: string, value: string }
  const [savingSecret, setSavingSecret] = useState(null); // string key

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
    loadSyncStatus();
    adminApi.getSettings().then((s) => {
      setSettings(s);
      setMarkupInput(String(s.markupPercent ?? ""));
      setReferralInput(String(s.referralRewardAmount ?? ""));
    });
  }, [loadSyncStatus]);

  useEffect(() => {
    if (activeTab === "customers") loadCustomers();
  }, [activeTab, loadCustomers]);

  useEffect(() => {
    if (activeTab === "configuration") loadSecrets();
  }, [activeTab, loadSecrets]);

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
    setLoadingDetail(true);
    try {
      const detail = await adminApi.getClientHistory(userId);
      setCustomerDetail(detail);
    } finally {
      setLoadingDetail(false);
    }
  }

  const orderTotalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const customerTotalPages = Math.max(
    1,
    Math.ceil(totalCustomers / customerLimit),
  );

  return (
    <div className="container admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>{t("admin.title")}</h1>
        <Button
          variant="secondary"
          icon={<LogOut size={16} />}
          onClick={onLogout}
        >
          {t("admin.logout")}
        </Button>
      </div>

      <nav className="admin-tabs">
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          <Package size={18} /> {t("admin.tab_orders")}
        </button>
        <button
          className={activeTab === "customers" ? "active" : ""}
          onClick={() => setActiveTab("customers")}
        >
          <Users size={18} /> {t("admin.tab_customers")}
        </button>
        <button
          className={activeTab === "configuration" ? "active" : ""}
          onClick={() => setActiveTab("configuration")}
        >
          <Settings size={18} /> {t("admin.tab_configuration")}
        </button>
      </nav>

      {activeTab === "orders" && (
        <div className="admin-tab-content">
          <div className="admin-dashboard-grid">
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
                      <dd className="admin-error-text">{syncMeta.lastError}</dd>
                    </>
                  )}
                </dl>
              ) : (
                <Spinner label={t("admin.sync_loading")} />
              )}
              <Button
                icon={<RefreshCw size={16} className={syncing ? "spin" : ""} />}
                onClick={onSync}
                disabled={syncing}
              >
                {syncing ? t("admin.syncing") : t("admin.sync_now")}
              </Button>
            </Card>
          </div>

          <div className="admin-orders-header">
            <h2>{t("admin.orders_title")}</h2>
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
        </div>
      )}

      {activeTab === "customers" && (
        <div className="admin-tab-content">
          {!selectedUserId ? (
            <>
              <div className="admin-customers-header">
                <h2>{t("admin.customers_title")}</h2>
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
            </>
          ) : (
            <div className="customer-detail-view">
              <Button
                variant="secondary"
                icon={<ArrowLeft size={16} />}
                onClick={() => setSelectedUserId(null)}
                className="back-btn"
              >
                {t("admin.back_to_list")}
              </Button>

              {loadingDetail ? (
                <Spinner label={t("admin.loading_customer_details")} />
              ) : customerDetail ? (
                <>
                  <div className="customer-detail-header">
                    <h1>{customerDetail.name}</h1>
                    <p>{customerDetail.email}</p>
                  </div>

                  <div className="admin-dashboard-grid">
                    <Card className="admin-card">
                      <h2>{t("admin.wallet_balance")}</h2>
                      <div className="balance-huge">
                        ${customerDetail.wallet?.balance?.toFixed(2) || "0.00"}
                      </div>
                      <h3 className="section-title">
                        {t("admin.transactions")}
                      </h3>
                      <div className="admin-kv-list">
                        {customerDetail.wallet?.transactions?.map((t2, i) => (
                          <div key={i} className="kv-item">
                            <span className="kv-label">
                              {formatDate(t2.createdAt)}
                            </span>
                            <span
                              className={`kv-value ${t2.type === "Credit" ? "text-success" : "text-danger"}`}
                            >
                              {t2.type === "Credit" ? "+" : "-"}$
                              {Number(t2.amount).toFixed(2)}
                            </span>
                            <span className="kv-desc">
                              {TRANSACTION_PURPOSE_LABELS[t2.purpose] ||
                                t2.purpose}
                            </span>
                          </div>
                        ))}
                        {(!customerDetail.wallet?.transactions ||
                          customerDetail.wallet.transactions.length === 0) && (
                          <p className="empty-text">
                            {t("admin.no_transactions")}
                          </p>
                        )}
                      </div>
                    </Card>

                    <Card className="admin-card">
                      <h2>{t("admin.order_history")}</h2>
                      <div className="admin-kv-list">
                        {customerDetail.orders?.map((o, i) => {
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
                        {(!customerDetail.orders ||
                          customerDetail.orders.length === 0) && (
                          <p className="empty-text">
                            {t("admin.no_orders_for_customer")}
                          </p>
                        )}
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <p>{t("admin.customer_not_found")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "configuration" && (
        <div className="admin-tab-content">
          <Card className="admin-card system-config-card">
            <h2 className="card-title">{t("admin.config_title")}</h2>
            <p className="admin-card-note">{t("admin.config_note")}</p>

            <div className="system-config-columns">
              <div className="system-config-column">
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
                        onSave={() => onUpdateSecret(key, editingSecret.value)}
                        saving={savingSecret === key}
                      />
                    ))}
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
                        setEditingSecret({ key: "ADMIN_PASSWORD_HASH", value })
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

              <div className="system-config-column">
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
                        onSave={() => onUpdateSecret(key, editingSecret.value)}
                        saving={savingSecret === key}
                      />
                    ))}
                  </div>
                ) : (
                  <Spinner label={t("admin.sync_loading")} />
                )}

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
                          onChange={(value) => setEditingSecret({ key, value })}
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
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

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
