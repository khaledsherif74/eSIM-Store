import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui/Card.jsx";
import { Button } from "../../ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import {
  Empty,
  Num,
  StateBox,
  errorText,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

function SettingsCard({ role }) {
  const { t } = useTranslation();
  const canEdit = role === "Admin";
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getFinanceSettings(),
    [],
  );
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data) {
      setForm({
        gatewayFeePercent: String(data.gatewayFeePercent),
        gatewayFeeFixedEgp: String(data.gatewayFeeFixedEgp),
        supplierLowBalanceUsd: String(data.supplierLowBalanceUsd),
      });
    }
  }, [data]);

  async function save() {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.updateFinanceSettings({
        gatewayFeePercent: form.gatewayFeePercent === "" ? "" : Number(form.gatewayFeePercent),
        gatewayFeeFixedEgp: form.gatewayFeeFixedEgp === "" ? "" : Number(form.gatewayFeeFixedEgp),
        supplierLowBalanceUsd: form.supplierLowBalanceUsd === "" ? "" : Number(form.supplierLowBalanceUsd),
      });
      setMsg({ type: "ok", text: t("admin.finance.settings_saved") });
      reload();
    } catch (err) {
      setMsg({ type: "err", text: errorText(err, t) });
    } finally {
      setSaving(false);
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.finance.settings_title")}</h2>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {form && (
          <div className="fin-form">
            <label className="fin-field">
              <span>{t("admin.finance.gateway_percent")}</span>
              <input type="number" min="0" max="100" step="0.01" value={form.gatewayFeePercent} onChange={set("gatewayFeePercent")} disabled={!canEdit} />
            </label>
            <label className="fin-field">
              <span>{t("admin.finance.gateway_fixed")}</span>
              <input type="number" min="0" step="0.01" value={form.gatewayFeeFixedEgp} onChange={set("gatewayFeeFixedEgp")} disabled={!canEdit} />
            </label>
            <label className="fin-field">
              <span>{t("admin.finance.low_balance_threshold")}</span>
              <input type="number" min="0" step="1" value={form.supplierLowBalanceUsd} onChange={set("supplierLowBalanceUsd")} disabled={!canEdit} />
            </label>
            <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
              {t("admin.finance.settings_note")}
            </p>
            {!canEdit && (
              <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
                {t("admin.finance.settings_admin_only")}
              </p>
            )}
            {msg.text && (
              <p className={msg.type === "err" ? "fin-form-error" : "fin-note"} role={msg.type === "err" ? "alert" : "status"}>
                {msg.text}
              </p>
            )}
            {canEdit && (
              <div className="fin-form-actions">
                <Button onClick={save} disabled={saving}>{t("admin.finance.save")}</Button>
              </div>
            )}
          </div>
        )}
      </StateBox>
    </Card>
  );
}

function LocksCard({ role }) {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listFinanceLocks(),
    [],
  );
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(month) {
    if (!window.confirm(t("admin.finance.unlock_confirm", { month }))) return;
    setBusy(true);
    setErr("");
    try {
      await adminApi.unlockFinanceMonth(month);
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.finance.locks_title")}</h2>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <Empty>{t("admin.finance.no_locks")}</Empty>
        ) : (
          data && (
            <div className="fin-table-wrap">
              <table className="admin-orders-table">
                <thead>
                  <tr>
                    <th>{t("admin.finance.month")}</th>
                    <th>{t("admin.finance.locked_by")}</th>
                    <th>{t("admin.finance.time")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((l) => (
                    <tr key={l.month}>
                      <td><Num>{l.month}</Num></td>
                      <td>{l.lockedBy}</td>
                      <td><Num>{new Date(l.lockedAt).toLocaleString()}</Num></td>
                      <td>
                        {role === "Admin" && (
                          <Button variant="secondary" size="sm" disabled={busy} onClick={() => unlock(l.month)}>
                            {t("admin.finance.unlock_month")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </StateBox>
      {err && <p className="fin-form-error" role="alert">{err}</p>}
    </Card>
  );
}

export function AuditCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listFinanceAudit({ page }),
    [page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const when = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Cairo",
  });

  return (
    <Card padded={false}>
      <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>
        {t("admin.finance.audit_title")}
      </h2>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <Empty>{t("admin.finance.no_audit")}</Empty>
        ) : (
          data && (
            <>
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.finance.time")}</th>
                      <th>{t("admin.finance.by")}</th>
                      <th>{t("admin.finance.role")}</th>
                      <th>{t("admin.finance.action")}</th>
                      <th>{t("admin.finance.details")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((a) => (
                      <tr key={a.id}>
                        <td><Num>{when.format(new Date(a.createdAt))}</Num></td>
                        <td>{a.actor}</td>
                        <td>{a.role}</td>
                        <td className="mono">{a.action}</td>
                        <td className="mono" style={{ overflowWrap: "anywhere" }}>
                          {a.details ? JSON.stringify(a.details) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("admin.previous")}
                </Button>
                <span>{t("admin.page_of", { page, total: pages })}</span>
                <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  {t("admin.next")}
                </Button>
              </div>
            </>
          )
        )}
      </StateBox>
    </Card>
  );
}

export function FinanceSettingsAudit({ role }) {
  const { t } = useTranslation();
  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.settings_audit_title")}</h1>
        <p>{t("admin.finance.settings_audit_sub")}</p>
      </div>
      <SettingsCard role={role} />
      <LocksCard role={role} />
      <AuditCard />
    </div>
  );
}
