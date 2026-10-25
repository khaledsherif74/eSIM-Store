import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  StateBox,
  errorText,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";

const POLICIES = ["policyTerms", "policyPrivacy", "policyRefund"];

export function SiteSettingsCard() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getSiteSettings(),
    [],
  );
  const [f, setF] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data) setF({ ...data });
  }, [data]);

  async function save() {
    if (
      f.maintenanceMode &&
      !data.maintenanceMode &&
      !window.confirm(t("admin.ops.maintenance_confirm"))
    )
      return;
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.updateSiteSettings(f);
      setMsg({ type: "ok", text: t("admin.ops.site_saved") });
      reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setSaving(false);
    }
  }
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.ops.site_title")}</h2>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {f && (
          <div className="fin-form">
            <label className="fin-field">
              <span>{t("admin.ops.site_name")}</span>
              <input
                value={f.siteName}
                maxLength={60}
                onChange={set("siteName")}
              />
            </label>
            <label className="fin-field">
              <span>{t("admin.ops.support_email")}</span>
              <input
                type="email"
                dir="ltr"
                value={f.supportEmail}
                onChange={set("supportEmail")}
              />
            </label>
            <label className="fin-field">
              <span>{t("admin.ops.admin_alert_email")}</span>
              <input
                type="email"
                dir="ltr"
                value={f.adminAlertEmail ?? ""}
                placeholder={t("admin.ops.admin_alert_email_placeholder")}
                onChange={set("adminAlertEmail")}
              />
            </label>
            <p
              className="fin-note"
              style={{ gridColumn: "1 / -1", marginTop: -8 }}
            >
              {t("admin.ops.admin_alert_email_hint")}
            </p>
            <label
              className="fin-field"
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <input
                type="checkbox"
                checked={f.maintenanceMode}
                onChange={(e) =>
                  setF((x) => ({ ...x, maintenanceMode: e.target.checked }))
                }
              />
              <span>{t("admin.ops.maintenance")}</span>
            </label>
            {f.maintenanceMode && (
              <div
                className="fin-alert danger"
                style={{ gridColumn: "1 / -1" }}
                role="note"
              >
                <AlertTriangle size={16} />
                {t("admin.ops.maintenance_warning")}
              </div>
            )}
            {POLICIES.map((k) => (
              <label className="fin-field wide" key={k}>
                <span>{t(`admin.ops.${k}`)}</span>
                <textarea
                  rows={4}
                  maxLength={20000}
                  value={f[k]}
                  onChange={set(k)}
                />
              </label>
            ))}
            <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
              {t("admin.ops.site_note")}
            </p>
            {msg.text && (
              <p
                className={msg.type === "err" ? "fin-form-error" : "fin-note"}
                role={msg.type === "err" ? "alert" : "status"}
              >
                {msg.text}
              </p>
            )}
            <div className="fin-form-actions">
              <Button onClick={save} disabled={saving}>
                {t("admin.finance.save")}
              </Button>
            </div>
          </div>
        )}
      </StateBox>
    </Card>
  );
}
