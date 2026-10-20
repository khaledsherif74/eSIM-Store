import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, errorText, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const TONE = { Sent: "success", Failed: "danger", Skipped: "warning" };
const TYPES = ["welcome", "order_access", "esim_ready", "password_reset", "admin_reset"];

export function EmailsTab() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listEmails({ status, type, q: search, page }),
    [status, type, search, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const commit = () => {
    if (q.trim() !== search) {
      setSearch(q.trim());
      setPage(1);
    }
  };

  async function resend(row) {
    if (!window.confirm(t("admin.ops.resend_confirm"))) return;
    setBusy(row.id);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.resendEmail(row.id);
      setMsg({ type: "ok", text: t("admin.ops.email_sent") });
      reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input value={q} maxLength={100} placeholder={t("admin.ops.email_search_hint")} onChange={(e) => setQ(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_status")}</span>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t("admin.finance.all")}</option>
            {Object.keys(TONE).map((s) => <option key={s} value={s}>{t(`admin.ops.mail_${s}`)}</option>)}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.users.type")}</span>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">{t("admin.finance.all")}</option>
            {TYPES.map((x) => <option key={x} value={x}>{t(`admin.ops.mailtype_${x}`)}</option>)}
          </select>
        </label>
      </div>
      {msg.text && <p className={msg.type === "err" ? "fin-form-error" : "fin-note"} role={msg.type === "err" ? "alert" : "status"}>{msg.text}</p>}
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.ops.no_emails")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.time")}</th>
                        <th>{t("admin.ops.recipient")}</th>
                        <th>{t("admin.users.type")}</th>
                        <th>{t("admin.finance.f_status")}</th>
                        <th>{t("admin.users.order")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((m) => (
                        <tr key={m.id}>
                          <td><Num>{new Date(m.at).toLocaleString()}</Num></td>
                          <td dir="ltr">{m.to}</td>
                          <td>{t(`admin.ops.mailtype_${m.type}`, m.type)}</td>
                          <td>
                            <Badge tone={TONE[m.status] || "neutral"}>{t(`admin.ops.mail_${m.status}`)}</Badge>
                            {m.error && <span className="fin-sub">{m.error}</span>}
                          </td>
                          <td className="mono">{m.orderId || "—"}</td>
                          <td>
                            {m.resendable && (
                              <Button size="sm" variant="secondary" disabled={busy === m.id} onClick={() => resend(m)}>{t("admin.ops.resend")}</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>{t("admin.previous")}</Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((x) => x + 1)}>{t("admin.next")}</Button>
                </div>
              </>
            )
          )}
        </StateBox>
      </Card>
      <p className="fin-note">{t("admin.ops.emails_note")}</p>
    </div>
  );
}
