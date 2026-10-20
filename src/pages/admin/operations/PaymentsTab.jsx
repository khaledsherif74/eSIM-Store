import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, fmtEgp, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

export function PaymentsTab() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listPayments({ provider, q: search, from, to, page }),
    [provider, search, from, to, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const commit = () => {
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
          <input value={q} maxLength={100} placeholder={t("admin.ops.pay_search_hint")} onChange={(e) => setQ(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} />
        </label>
        <label className="fin-field">
          <span>{t("admin.ops.provider")}</span>
          <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }}>
            <option value="">{t("admin.finance.all")}</option>
            {(data?.providers || []).map((p) => <option key={p} value={p}>{p}</option>)}
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
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.ops.no_payment_events")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.time")}</th>
                        <th>{t("admin.ops.provider")}</th>
                        <th>{t("admin.users.type")}</th>
                        <th className="num">{t("admin.users.amount")}</th>
                        <th>{t("admin.users.order")}</th>
                        <th>{t("admin.ops.transaction")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((p) => (
                        <tr key={p.id}>
                          <td><Num>{new Date(p.receivedAt).toLocaleString()}</Num></td>
                          <td>{p.provider}</td>
                          <td>
                            {t(`admin.ops.kind_${p.kind}`)}
                            {p.success === false && <Badge tone="danger">{t("admin.ops.failed")}</Badge>}
                            {p.pending === true && <Badge tone="warning">{t("admin.ops.pending")}</Badge>}
                          </td>
                          <td className="num"><Num>{p.amount == null ? "—" : p.currency === "USD" ? fmtUsd(p.amount) : fmtEgp(p.amount)}</Num></td>
                          <td className="mono">{p.orderId || "—"}</td>
                          <td className="mono">{p.transactionId || "—"}</td>
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
      <p className="fin-note">{t("admin.ops.payments_note")}</p>
    </div>
  );
}
