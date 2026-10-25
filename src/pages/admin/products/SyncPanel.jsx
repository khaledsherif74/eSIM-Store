import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Spinner } from "../../../components/ui/Spinner.jsx";
import { formatDate } from "../../../utils/orderData.js";
import { adminApi } from "../../../services/adminApi.js";
import { adminApiExtra } from "../../../services/adminApiExtra.js";
import { errorText, fmtNum } from "../../../components/admin/finance/financeUtils.jsx";
import { useTranslation } from "react-i18next";

export function SyncPanel() {
  const { t } = useTranslation();
  const [syncMeta, setSyncMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ syncIntervalMinutes: "", maxDeactivationPercent: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    adminApi.syncStatus().then(setSyncMeta).catch((err) => console.error("[admin] sync status failed:", err));
    adminApiExtra
      .getSyncSettings()
      .then((s) => {
        setCfg(s);
        setForm({
          syncIntervalMinutes: String(s.syncIntervalMinutes),
          maxDeactivationPercent: String(s.maxDeactivationPercent),
        });
      })
      .catch((err) => console.error("[admin] sync settings failed:", err));
  }, []);

  async function onSync() {
    setSyncing(true);
    const before = syncMeta?.lastAttemptAt;
    try {
      await adminApi.triggerSync();
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const meta = await adminApi.syncStatus();
          if (meta.lastAttemptAt !== before || attempts >= 20) {
            setSyncMeta(meta);
            clearInterval(poll);
            setSyncing(false);
          }
        } catch {
          clearInterval(poll);
          setSyncing(false);
        }
      }, 3000);
    } catch {
      setSyncing(false);
    }
  }

  async function saveCfg() {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const s = await adminApiExtra.updateSyncSettings({
        syncIntervalMinutes: Number(form.syncIntervalMinutes),
        maxDeactivationPercent: Number(form.maxDeactivationPercent),
      });
      setCfg(s);
      setMsg({ type: "ok", text: t("admin.products.sync_saved") });
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const fx = cfg?.fx;

  return (
    <section className="admin-section fin-wrap">
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
            <dd>{syncMeta.lastAttemptAt ? formatDate(syncMeta.lastAttemptAt) : "—"}</dd>
            <dt>{t("admin.sync_last_success")}</dt>
            <dd>{syncMeta.lastSuccessAt ? formatDate(syncMeta.lastSuccessAt) : "—"}</dd>
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
        <Button icon={<RefreshCw size={16} className={syncing ? "spin" : ""} />} onClick={onSync} disabled={syncing}>
          {syncing ? t("admin.syncing") : t("admin.sync_now")}
        </Button>
      </Card>

      <Card>
        <h2 className="fin-card-title">{t("admin.products.sync_settings_title")}</h2>
        {!cfg ? (
          <Spinner label={t("admin.sync_loading")} />
        ) : (
          <div className="fin-form">
            <label className="fin-field">
              <span>{t("admin.products.sync_interval")}</span>
              <input type="number" min="1" max="1440" step="1" value={form.syncIntervalMinutes} onChange={set("syncIntervalMinutes")} />
              <small className="fin-sub">{t("admin.products.sync_interval_hint")}</small>
            </label>
            <label className="fin-field">
              <span>{t("admin.products.max_deact")}</span>
              <input type="number" min="1" max="100" step="1" value={form.maxDeactivationPercent} onChange={set("maxDeactivationPercent")} />
              <small className="fin-sub">{t("admin.products.max_deact_hint")}</small>
            </label>
            {msg.text && <p className={msg.type === "err" ? "fin-form-error" : "fin-note"} role={msg.type === "err" ? "alert" : "status"}>{msg.text}</p>}
            <div className="fin-form-actions">
              <Button onClick={saveCfg} disabled={saving}>{t("admin.finance.save")}</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="fin-card-title">{t("admin.products.fx_auto_title")}</h2>
        <strong style={{ fontSize: 24 }} dir="ltr">
          1 USD = {fx?.rate ? fmtNum(fx.rate, 2) : "—"} EGP
        </strong>
        <p className="fin-note" style={{ marginBlockStart: 8 }}>
          {t("admin.products.fx_auto_note")}
          {fx?.updatedAt ? ` ${t("admin.products.fx_updated", { time: formatDate(fx.updatedAt) })}` : ""}
          {fx && fx.source && fx.source !== "live" ? ` ${t("admin.products.fx_stale")}` : ""}
        </p>
      </Card>
    </section>
  );
}
