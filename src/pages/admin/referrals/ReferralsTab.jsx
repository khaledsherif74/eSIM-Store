import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, errorText, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const STATUSES = ["Pending", "Paid", "Flagged", "Revoked"];
const TONE = { Pending: "neutral", Paid: "success", Flagged: "warning", Revoked: "danger" };

export function ReferralsTab() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listReferrals({ status, q: search, page }),
    [status, search, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function act(id, fn, promptKey) {
    let reason;
    if (promptKey) {
      reason = window.prompt(t(promptKey));
      if (!reason || !reason.trim()) return;
      reason = reason.trim();
    } else if (!window.confirm(t("admin.referrals.approve_confirm"))) {
      return;
    }
    setBusy(id);
    setErr("");
    try {
      await fn(id, reason);
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(null);
    }
  }
  const commitSearch = () => {
    if (q.trim() !== search) {
      setSearch(q.trim());
      setPage(1);
    }
  };

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} onBlur={commitSearch} onKeyDown={(e) => e.key === "Enter" && commitSearch()} placeholder={t("admin.users.search_placeholder")} />
        </label>
        <div className="fin-row-actions" role="group" aria-label={t("admin.referrals.status")}>
          {["", ...STATUSES].map((s) => (
            <Button key={s || "all"} size="sm" variant={status === s ? "primary" : "secondary"} onClick={() => { setStatus(s); setPage(1); }}>
              {s ? t(`admin.referrals.status_${s}`) : t("admin.finance.all")}
              {data ? ` (${s ? data.counts[s] : Object.values(data.counts).reduce((a, b) => a + b, 0)})` : ""}
            </Button>
          ))}
        </div>
      </div>
      {err && <div className="fin-alert danger" role="alert">{err}</div>}
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.referrals.none")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.referrals.referrer")}</th>
                        <th>{t("admin.referrals.referred")}</th>
                        <th>{t("admin.referrals.status")}</th>
                        <th>{t("admin.referrals.order")}</th>
                        <th className="num">{t("admin.referrals.reward")}</th>
                        <th>{t("admin.users.date")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((r) => (
                        <tr key={r.id}>
                          <td><Link to={`/admin/users/${r.referrer.id}`} className="fin-link" dir="ltr">{r.referrer.email}</Link></td>
                          <td><Link to={`/admin/users/${r.referred.id}`} className="fin-link" dir="ltr">{r.referred.email}</Link></td>
                          <td>
                            <Badge tone={TONE[r.status]}>{t(`admin.referrals.status_${r.status}`)}</Badge>
                            {r.flagReason.map((f) => (
                              <span className="fin-sub" key={f}>{t(`admin.referrals.flag_${f}`, f)}</span>
                            ))}
                            {r.reviewedBy && <span className="fin-sub">{t("admin.referrals.reviewed_by", { name: r.reviewedBy })}</span>}
                          </td>
                          <td className="mono">{r.orderId || "—"}</td>
                          <td className="num"><Num>{r.rewardAmount == null ? "—" : fmtUsd(r.rewardAmount)}</Num></td>
                          <td><Num>{String(r.createdAt).slice(0, 10)}</Num></td>
                          <td>
                            <div className="fin-row-actions">
                              {r.status === "Flagged" && (
                                <>
                                  <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, (id) => adminApi.approveReferral(id))}>{t("admin.referrals.approve")}</Button>
                                  <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => act(r.id, (id, why) => adminApi.rejectReferral(id, why), "admin.referrals.reason_prompt")}>{t("admin.referrals.reject")}</Button>
                                </>
                              )}
                              {r.status === "Paid" && (
                                <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => act(r.id, (id, why) => adminApi.revokeReferral(id, why), "admin.referrals.reason_prompt")}>{t("admin.referrals.revoke")}</Button>
                              )}
                            </div>
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
      <p className="fin-note">{t("admin.referrals.fraud_note")}</p>
    </div>
  );
}
