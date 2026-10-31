import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Plus, X } from "lucide-react";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { useSiteInfo } from "../../../hooks/useSiteInfo.jsx";
import {
  StateBox,
  errorText,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";

const POLICIES = ["policyTerms", "policyPrivacy", "policyRefund"];
const MAX_ADMIN_ALERT_EMAILS = 20;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,24}$/;

function normalizeEmailList(value) {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [value]
      : [];

  return [
    ...new Set(
      values
        .filter((email) => typeof email === "string")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function SiteSettingsCard() {
  const { t } = useTranslation();
  const { refreshSiteInfo } = useSiteInfo();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getSiteSettings(),
    [],
  );
  const [f, setF] = useState(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data)
      setF({
        ...data,
        // Existing installations stored this setting as one string. Normalize it
        // in the UI so it can be managed as a list without losing the old value.
        adminAlertEmail: normalizeEmailList(data.adminAlertEmail),
      });
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
      await refreshSiteInfo();
      setMsg({ type: "ok", text: t("admin.ops.site_saved") });
      await reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setSaving(false);
    }
  }

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  function addAdminEmail() {
    const email = emailDraft.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setMsg({ type: "err", text: "Enter a valid email address." });
      return;
    }
    if (f.adminAlertEmail.includes(email)) {
      setMsg({
        type: "err",
        text: "This email address has already been added.",
      });
      return;
    }
    if (f.adminAlertEmail.length >= MAX_ADMIN_ALERT_EMAILS) {
      setMsg({
        type: "err",
        text: `You can add up to ${MAX_ADMIN_ALERT_EMAILS} email addresses.`,
      });
      return;
    }

    setF((current) => ({
      ...current,
      adminAlertEmail: [...current.adminAlertEmail, email],
    }));
    setEmailDraft("");
    setMsg({ type: "", text: "" });
  }

  function removeAdminEmail(emailToRemove) {
    setF((current) => ({
      ...current,
      adminAlertEmail: current.adminAlertEmail.filter(
        (email) => email !== emailToRemove,
      ),
    }));
  }

  function handleEmailKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      addAdminEmail();
    }
  }

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

            <div className="fin-field wide">
              <span>{t("admin.ops.admin_alert_email")}</span>
              <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
                <input
                  type="email"
                  dir="ltr"
                  value={emailDraft}
                  placeholder={t("admin.ops.admin_alert_email_placeholder")}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  onKeyDown={handleEmailKeyDown}
                  aria-label={t("admin.ops.admin_alert_email")}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={15} />}
                  onClick={addAdminEmail}
                  disabled={f.adminAlertEmail.length >= MAX_ADMIN_ALERT_EMAILS}
                >
                  Add email
                </Button>
              </div>

              <div
                role="list"
                aria-label={t("admin.ops.admin_alert_email")}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                {f.adminAlertEmail.length ? (
                  f.adminAlertEmail.map((email) => (
                    <div
                      key={email}
                      role="listitem"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        maxWidth: "100%",
                        padding: "6px 9px",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        background: "var(--color-surface-alt)",
                        color: "var(--color-text)",
                      }}
                    >
                      <span dir="ltr" style={{ overflowWrap: "anywhere" }}>
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAdminEmail(email)}
                        aria-label={`Remove ${email}`}
                        title={`Remove ${email}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: 0,
                          padding: 2,
                          background: "transparent",
                          color: "var(--color-text-muted)",
                          cursor: "pointer",
                          flex: "none",
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <span style={{ fontWeight: 400 }}>
                    No alert email addresses added. The ADMIN_EMAIL fallback
                    will be used when configured.
                  </span>
                )}
              </div>
              <p className="fin-note" style={{ margin: 0 }}>
                {t("admin.ops.admin_alert_email_hint")}
              </p>
            </div>

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
