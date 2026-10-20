import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { adminApi } from "../../services/adminApi.js";
import {
  Empty,
  Kpi,
  Num,
  StateBox,
  errorText,
  fmtEgp,
  fmtNum,
  fmtUsd,
  useAsync,
} from "../../components/admin/finance/financeUtils.jsx";
import { SegmentBadge } from "./UsersPage.jsx";
import "../../components/admin/finance/finance.css";

const day = (iso) => (iso ? String(iso).slice(0, 10) : "—");

function Table({ head, children }) {
  return (
    <div className="fin-table-wrap">
      <table className="admin-orders-table">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className={h.num ? "num" : undefined}>{h.label}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: u, loading, error, reload } = useAsync(() => adminApi.getCustomer(id), [id]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function run(action) {
    setBusy(true);
    setErr("");
    try {
      await action();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(false);
    }
  }

  const block = () =>
    run(async () => {
      const reason = window.prompt(t("admin.users.block_prompt"));
      if (!reason || !reason.trim()) return;
      await adminApi.setCustomerBlocked(id, { blocked: true, blockedReason: reason.trim() });
      reload();
    });
  const unblock = () =>
    run(async () => {
      if (!window.confirm(t("admin.users.unblock_confirm"))) return;
      await adminApi.setCustomerBlocked(id, { blocked: false });
      reload();
    });
  const anonymize = () =>
    run(async () => {
      if (!window.confirm(t("admin.users.anonymize_confirm", { email: u.email }))) return;
      await adminApi.anonymizeCustomer(id);
      reload();
    });
  const addNote = () =>
    run(async () => {
      if (!note.trim()) return;
      await adminApi.addCustomerNote(id, note.trim());
      setNote("");
      reload();
    });

  return (
    <section className="admin-section fin-wrap">
      <div>
        <Link to="/admin/users" className="fin-link" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <ArrowLeft size={14} /> {t("admin.users.back")}
        </Link>
      </div>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {u && (
          <>
            <header className="admin-section-head">
              <h1>{u.deleted ? t("admin.users.anonymized") : u.name || u.email}</h1>
              <p dir="ltr">{u.email}</p>
              <div className="fin-row-actions">
                <SegmentBadge segment={u.stats.segment} />
                {u.blocked && !u.deleted && <Badge tone="danger">{t("admin.users.blocked")}</Badge>}
                {u.deleted && <Badge tone="neutral">{t("admin.users.anonymized")}</Badge>}
              </div>
            </header>

            {err && <div className="fin-alert danger" role="alert">{err}</div>}
            {u.blocked && !u.deleted && (
              <div className="fin-alert danger" role="note">
                {t("admin.users.blocked_reason", { reason: u.blockedReason || "—" })}
              </div>
            )}

            {!u.deleted && (
              <div className="fin-row-actions">
                {u.blocked ? (
                  <Button variant="secondary" size="sm" onClick={unblock} disabled={busy}>{t("admin.users.unblock")}</Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={block} disabled={busy}>{t("admin.users.block")}</Button>
                )}
                <Button variant="danger" size="sm" onClick={anonymize} disabled={busy}>{t("admin.users.anonymize")}</Button>
              </div>
            )}

            <div className="fin-grid">
              <Kpi label={t("admin.users.orders")} value={fmtNum(u.stats.orders, 0)} />
              <Kpi label={t("admin.users.spend")} value={fmtEgp(u.stats.spend)} />
              <Kpi label={t("admin.users.wallet")} value={fmtUsd(u.wallet ? u.wallet.balance : 0)} />
              <Kpi label={t("admin.users.last_order")} value={day(u.stats.lastOrderAt)} sub={t("admin.users.signed_up", { date: day(u.createdAt) })} />
            </div>

            <Card padded={false}>
              <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>{t("admin.users.orders_title")}</h2>
              {u.orders.length === 0 ? <Empty>{t("admin.users.no_orders")}</Empty> : (
                <Table head={[{ label: t("admin.users.date") }, { label: t("admin.users.product") }, { label: t("admin.finance.f_status") }, { label: t("admin.users.coupon") }, { label: t("admin.users.price"), num: true }]}>
                  {u.orders.map((o) => (
                    <tr key={o.orderId}>
                      <td><Num>{day(o.createdAt)}</Num></td>
                      <td>{o.productTitle}<span className="fin-sub mono">{o.orderId}</span></td>
                      <td>{o.status}</td>
                      <td>{o.couponCode ? `${o.couponCode} (−${fmtEgp(o.discountAmount)})` : "—"}</td>
                      <td className="num"><Num>{o.price == null ? "—" : fmtEgp(o.price)}</Num></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>

            <div className="fin-grid-2">
              <Card padded={false}>
                <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>{t("admin.users.wallet_title")}</h2>
                {!u.wallet || u.wallet.transactions.length === 0 ? <Empty>{t("admin.users.no_wallet")}</Empty> : (
                  <Table head={[{ label: t("admin.users.date") }, { label: t("admin.users.type") }, { label: t("admin.users.amount"), num: true }]}>
                    {u.wallet.transactions.map((x) => (
                      <tr key={x.id}>
                        <td><Num>{day(x.createdAt)}</Num></td>
                        <td>{x.purpose}<span className="fin-sub">{x.type}</span></td>
                        <td className="num"><Num>{fmtUsd(x.amount)}</Num></td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>

              <Card padded={false}>
                <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>{t("admin.users.coupons_title")}</h2>
                {u.coupons.length === 0 ? <Empty>{t("admin.users.no_coupons")}</Empty> : (
                  <Table head={[{ label: t("admin.users.date") }, { label: t("admin.coupons.code") }, { label: t("admin.coupons.discount"), num: true }]}>
                    {u.coupons.map((c) => (
                      <tr key={c.orderId}>
                        <td><Num>{day(c.at)}</Num></td>
                        <td className="mono">{c.code}<span className="fin-sub">{c.status || ""}</span></td>
                        <td className="num"><Num>{fmtEgp(c.discountAmount)}</Num></td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>

              <Card>
                <h2 className="fin-card-title">{t("admin.users.referrals_title")}</h2>
                {u.referrals.referredBy && (
                  <p className="fin-note">
                    {t("admin.users.referred_by", { email: u.referrals.referredBy.email })} ({u.referrals.referredBy.rewardStatus})
                  </p>
                )}
                {u.referrals.invited.length === 0 ? (
                  <p className="fin-note">{t("admin.users.no_referrals")}</p>
                ) : (
                  <Table head={[{ label: t("admin.users.user") }, { label: t("admin.finance.f_status") }]}>
                    {u.referrals.invited.map((r) => (
                      <tr key={r.id}>
                        <td dir="ltr">{r.email}</td>
                        <td>{r.rewardStatus}</td>
                      </tr>
                    ))}
                  </Table>
                )}
              </Card>

              <Card>
                <h2 className="fin-card-title">{t("admin.users.notes_title")}</h2>
                {!u.deleted && (
                  <div className="fin-form" style={{ marginBlockEnd: 12 }}>
                    <label className="fin-field wide">
                      <span>{t("admin.users.add_note")}</span>
                      <textarea value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
                    </label>
                    <div className="fin-form-actions">
                      <Button size="sm" onClick={addNote} disabled={busy || !note.trim()}>{t("admin.users.save_note")}</Button>
                    </div>
                  </div>
                )}
                {u.notes.length === 0 ? (
                  <p className="fin-note">{t("admin.users.no_notes")}</p>
                ) : (
                  u.notes.map((n) => (
                    <p key={n.id} style={{ margin: "0 0 10px" }}>
                      {n.note}
                      <span className="fin-sub">{n.authorName} · <Num>{new Date(n.at).toLocaleString()}</Num></span>
                    </p>
                  ))
                )}
              </Card>
            </div>
          </>
        )}
      </StateBox>
    </section>
  );
}
