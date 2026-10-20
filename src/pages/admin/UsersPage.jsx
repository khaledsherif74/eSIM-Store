import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { adminApi } from "../../services/adminApi.js";
import {
  Empty,
  Num,
  StateBox,
  errorText,
  fmtEgp,
  fmtUsd,
  useAsync,
} from "../../components/admin/finance/financeUtils.jsx";
import "../../components/admin/finance/finance.css";

const SEGMENTS = ["VIP", "New", "Active", "Inactive"];
const SEGMENT_TONE = { VIP: "primary", New: "success", Active: "neutral", Inactive: "warning" };

export function SegmentBadge({ segment }) {
  const { t } = useTranslation();
  if (!segment) return null;
  return <Badge tone={SEGMENT_TONE[segment] || "neutral"}>{t(`admin.users.segment_${segment}`)}</Badge>;
}

export function UsersPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("");
  const [page, setPage] = useState(1);
  const [vipInput, setVipInput] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(
    () => adminApi.listCustomers({ q: search, segment, page }),
    [search, segment, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  useEffect(() => {
    if (data) setVipInput(String(data.vipSpendEgp));
  }, [data?.vipSpendEgp]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitSearch = () => {
    if (q.trim() !== search) {
      setSearch(q.trim());
      setPage(1);
    }
  };

  async function saveVip() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.updateSettings({ vipSpendEgp: vipInput === "" ? "" : Number(vipInput) });
      setMsg({ type: "ok", text: t("admin.users.vip_saved") });
      reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.downloadCustomersCsv({ q: search, segment });
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-section fin-wrap">
      <header className="admin-section-head">
        <h1>{t("admin.nav.users")}</h1>
        <p>{t("admin.users.sub")}</p>
      </header>

      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input
            value={q}
            maxLength={100}
            placeholder={t("admin.users.search_placeholder")}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.users.segment")}</span>
          <select
            value={segment}
            onChange={(e) => {
              setSegment(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("admin.finance.all")}</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>{t(`admin.users.segment_${s}`)}</option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.users.vip_threshold")}</span>
          <input type="number" min="0" step="100" value={vipInput} onChange={(e) => setVipInput(e.target.value)} />
        </label>
        <Button variant="secondary" size="sm" onClick={saveVip} disabled={busy || vipInput === ""}>
          {t("admin.finance.save")}
        </Button>
        <span className="fin-spacer" />
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCsv} disabled={busy}>
          {t("admin.finance.export_csv")}
        </Button>
      </div>
      {msg.text && (
        <p className={msg.type === "err" ? "fin-form-error" : "fin-note"} role={msg.type === "err" ? "alert" : "status"}>
          {msg.text}
        </p>
      )}
      <p className="fin-note">{t("admin.users.segments_note")}</p>

      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.users.none")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.users.user")}</th>
                        <th>{t("admin.users.signup")}</th>
                        <th className="num">{t("admin.users.orders")}</th>
                        <th className="num">{t("admin.users.spend")}</th>
                        <th className="num">{t("admin.users.wallet")}</th>
                        <th>{t("admin.users.segment")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((u) => (
                        <tr key={u.id} style={u.blocked ? { opacity: 0.6 } : undefined}>
                          <td>
                            <Link to={`/admin/users/${u.id}`} className="fin-link">{u.name || u.email}</Link>
                            {u.name && <span className="fin-sub" dir="ltr">{u.email}</span>}
                          </td>
                          <td><Num>{String(u.createdAt).slice(0, 10)}</Num></td>
                          <td className="num"><Num>{u.orders}</Num></td>
                          <td className="num"><Num>{fmtEgp(u.spend)}</Num></td>
                          <td className="num"><Num>{fmtUsd(u.wallet)}</Num></td>
                          <td>
                            <SegmentBadge segment={u.segment} />
                            {u.blocked && <Badge tone="danger">{t("admin.users.blocked")}</Badge>}
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
    </section>
  );
}
