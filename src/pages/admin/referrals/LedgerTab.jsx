import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Kpi, Num, StateBox, errorText, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const PURPOSES = ["Topup", "Purchase", "ReferralReward", "Adjustment", "ReferralRevoke", "Expiry"];

function AdjustForm({ onDone }) {
  const { t } = useTranslation();
  const [f, setF] = useState({ userId: "", direction: "Credit", amountUsd: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function save() {
    if (!window.confirm(t("admin.referrals.adjust_confirm"))) return;
    setSaving(true);
    setErr("");
    try {
      await adminApi.adjustWallet({ ...f, userId: f.userId.trim(), amountUsd: f.amountUsd === "" ? "" : Number(f.amountUsd) });
      setF({ userId: "", direction: "Credit", amountUsd: "", reason: "" });
      onDone();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.referrals.adjust_title")}</h2>
      <div className="fin-form">
        <label className="fin-field">
          <span>{t("admin.referrals.user_id")}</span>
          <input dir="ltr" value={f.userId} onChange={set("userId")} placeholder={t("admin.referrals.user_id_hint")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.referrals.direction")}</span>
          <select value={f.direction} onChange={set("direction")}>
            <option value="Credit">{t("admin.referrals.credit")}</option>
            <option value="Debit">{t("admin.referrals.debit")}</option>
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.referrals.amount_usd")}</span>
          <input type="number" min="0" step="0.01" value={f.amountUsd} onChange={set("amountUsd")} />
        </label>
        <label className="fin-field wide">
          <span>{t("admin.referrals.reason")}</span>
          <input value={f.reason} maxLength={300} onChange={set("reason")} />
        </label>
        {err && <p className="fin-form-error" role="alert">{err}</p>}
        <div className="fin-form-actions">
          <Button onClick={save} disabled={saving || !f.reason.trim() || !f.userId.trim()}>{t("admin.referrals.apply_adjustment")}</Button>
        </div>
      </div>
    </Card>
  );
}

export function LedgerTab() {
  const { t } = useTranslation();
  const [purpose, setPurpose] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getLedger({ purpose, q: search, from, to, page }),
    [purpose, search, from, to, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
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
          <input value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} onBlur={commitSearch} onKeyDown={(e) => e.key === "Enter" && commitSearch()} placeholder="email" />
        </label>
        <label className="fin-field">
          <span>{t("admin.users.type")}</span>
          <select value={purpose} onChange={(e) => { setPurpose(e.target.value); setPage(1); }}>
            <option value="">{t("admin.finance.all")}</option>
            {PURPOSES.map((p) => <option key={p} value={p}>{t(`admin.referrals.purpose_${p}`)}</option>)}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.from")}</span>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.to")}</span>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </label>
      </div>

      {data && (
        <div className="fin-grid">
          <Kpi label={t("admin.referrals.earned")} value={fmtUsd(data.totals.earned)} />
          <Kpi label={t("admin.referrals.spent")} value={fmtUsd(data.totals.spent)} />
          <Kpi label={t("admin.referrals.expired")} value={fmtUsd(data.totals.expired)} />
          <Kpi label={t("admin.referrals.revoked")} value={fmtUsd(data.totals.revoked)} />
          <Kpi label={t("admin.referrals.topups")} value={fmtUsd(data.totals.topups)} />
          <Kpi label={t("admin.referrals.adjustments")} value={fmtUsd(data.totals.adjustments)} />
        </div>
      )}

      <AdjustForm onDone={reload} />

      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.referrals.no_ledger")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.time")}</th>
                        <th>{t("admin.users.user")}</th>
                        <th>{t("admin.users.type")}</th>
                        <th className="num">{t("admin.users.amount")}</th>
                        <th>{t("admin.referrals.note")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((x) => (
                        <tr key={x.id}>
                          <td><Num>{new Date(x.createdAt).toLocaleString()}</Num></td>
                          <td><Link to={`/admin/users/${x.userId}`} className="fin-link" dir="ltr">{x.email}</Link></td>
                          <td>{t(`admin.referrals.purpose_${x.purpose}`)}<span className="fin-sub">{x.type}</span></td>
                          <td className="num"><Num>{x.type === "Debit" ? "−" : "+"}{fmtUsd(x.amount)}</Num></td>
                          <td>{x.note || "—"}{x.createdBy && <span className="fin-sub">{x.createdBy}</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>{t("admin.previous")}</Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((v) => v + 1)}>{t("admin.next")}</Button>
                </div>
              </>
            )
          )}
        </StateBox>
      </Card>
    </div>
  );
}
