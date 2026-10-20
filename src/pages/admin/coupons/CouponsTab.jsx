import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Empty,
  Kpi,
  Num,
  StateBox,
  errorText,
  fmtEgp,
  fmtNum,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";
import { cairoDate, fromList, toList } from "./couponUtils.js";

const blank = () => ({
  code: "",
  type: "Percent",
  value: "10",
  firstOrderOnly: false,
  overrideFloor: false,
  productIds: "",
  countries: "",
  providerIds: "",
  startsAt: "",
  endsAt: "",
  maxUsesTotal: "",
  maxUsesPerUser: "1",
  active: true,
});

const fromCoupon = (c) => ({
  code: c.code,
  type: c.type,
  value: String(c.value),
  firstOrderOnly: c.firstOrderOnly,
  overrideFloor: c.overrideFloor,
  productIds: fromList(c.productIds),
  countries: fromList(c.countries),
  providerIds: fromList(c.providerIds),
  startsAt: cairoDate(c.startsAt),
  endsAt: cairoDate(c.endsAt),
  maxUsesTotal: c.maxUsesTotal == null ? "" : String(c.maxUsesTotal),
  maxUsesPerUser: c.maxUsesPerUser == null ? "" : String(c.maxUsesPerUser),
  active: c.active,
});

const toPayload = (f) => ({
  code: f.code,
  type: f.type,
  value: f.value === "" ? "" : Number(f.value),
  firstOrderOnly: f.firstOrderOnly,
  overrideFloor: f.overrideFloor,
  productIds: toList(f.productIds),
  countries: toList(f.countries),
  providerIds: toList(f.providerIds),
  startsAt: f.startsAt || null,
  endsAt: f.endsAt || null,
  maxUsesTotal: f.maxUsesTotal === "" ? null : Number(f.maxUsesTotal),
  maxUsesPerUser: f.maxUsesPerUser === "" ? null : Number(f.maxUsesPerUser),
  active: f.active,
});

function CouponForm({ editing, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [f, setF] = useState(editing ? fromCoupon(editing) : blank());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save() {
    setSaving(true);
    setErr("");
    try {
      if (editing) await adminApi.updateCoupon(editing.id, toPayload(f));
      else await adminApi.createCoupon(toPayload(f));
      onSaved();
    } catch (e) {
      setErr(errorText(e, t));
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="fin-card-title">{editing ? t("admin.coupons.edit") : t("admin.coupons.new")}</h2>
      <div className="fin-form">
        <label className="fin-field">
          <span>{t("admin.coupons.code")}</span>
          <input dir="ltr" value={f.code} onChange={set("code")} disabled={Boolean(editing)} maxLength={32} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.type")}</span>
          <select value={f.type} onChange={set("type")}>
            <option value="Percent">{t("admin.coupons.type_percent")}</option>
            <option value="Fixed">{t("admin.coupons.type_fixed")}</option>
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.value")}</span>
          <input type="number" min="0" step="0.01" value={f.value} onChange={set("value")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.starts")}</span>
          <input type="date" value={f.startsAt} onChange={set("startsAt")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.ends")}</span>
          <input type="date" value={f.endsAt} onChange={set("endsAt")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.max_total")}</span>
          <input type="number" min="1" step="1" value={f.maxUsesTotal} onChange={set("maxUsesTotal")} placeholder={t("admin.coupons.unlimited")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.max_user")}</span>
          <input type="number" min="1" step="1" value={f.maxUsesPerUser} onChange={set("maxUsesPerUser")} placeholder={t("admin.coupons.unlimited")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.products")}</span>
          <input dir="ltr" value={f.productIds} onChange={set("productIds")} placeholder={t("admin.coupons.all_hint")} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.countries")}</span>
          <input dir="ltr" value={f.countries} onChange={set("countries")} placeholder="TR, EG" />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.providers")}</span>
          <input dir="ltr" value={f.providerIds} onChange={set("providerIds")} placeholder={t("admin.coupons.all_hint")} />
        </label>
        <label className="fin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={f.firstOrderOnly} onChange={set("firstOrderOnly")} />
          <span>{t("admin.coupons.first_order")}</span>
        </label>
        <label className="fin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={f.overrideFloor} onChange={set("overrideFloor")} />
          <span>{t("admin.coupons.override_floor")}</span>
        </label>
        <label className="fin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={f.active} onChange={set("active")} />
          <span>{t("admin.products.active")}</span>
        </label>
        <p className="fin-note" style={{ gridColumn: "1 / -1" }}>{t("admin.coupons.form_note")}</p>
        {err && <p className="fin-form-error" role="alert">{err}</p>}
        <div className="fin-form-actions">
          <Button onClick={save} disabled={saving}>{t("admin.finance.save")}</Button>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>{t("admin.finance.cancel")}</Button>
        </div>
      </div>
    </Card>
  );
}

function Report({ coupon, onClose }) {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.getCouponReport(coupon.id), [coupon.id]);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="fin-card-title">{t("admin.coupons.report_title", { code: coupon.code })}</h2>
        <Button variant="secondary" size="sm" onClick={onClose}>{t("admin.coupons.close")}</Button>
      </div>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="fin-grid">
              <Kpi label={t("admin.coupons.uses")} value={fmtNum(data.totals.uses, 0)} sub={t("admin.coupons.completed_n", { count: data.totals.completedUses })} />
              <Kpi label={t("admin.coupons.discount_given")} value={fmtEgp(data.totals.discountGiven)} />
              <Kpi label={t("admin.coupons.revenue")} value={fmtEgp(data.totals.revenue)} />
              <Kpi label={t("admin.coupons.profit")} value={fmtEgp(data.totals.profit)} tone={data.totals.profit >= 0 ? "good" : "bad"} sub={t("admin.coupons.profit_note")} />
            </div>
            {data.redemptions.length === 0 ? (
              <Empty>{t("admin.coupons.no_redemptions")}</Empty>
            ) : (
              <div className="fin-table-wrap" style={{ marginBlockStart: 12 }}>
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.finance.time")}</th>
                      <th>{t("admin.coupons.email")}</th>
                      <th>{t("admin.coupons.order")}</th>
                      <th className="num">{t("admin.coupons.discount")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.redemptions.map((r) => (
                      <tr key={r.orderId}>
                        <td><Num>{new Date(r.at).toLocaleString()}</Num></td>
                        <td dir="ltr">{r.email}</td>
                        <td className="mono">{r.orderId}</td>
                        <td className="num"><Num>{fmtEgp(r.discountAmount)}</Num></td>
                        <td>{r.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </StateBox>
    </Card>
  );
}

export function CouponsTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.listCoupons(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  async function toggle(c) {
    setBusy(c.id);
    setErr("");
    try {
      await adminApi.updateCoupon(c.id, { active: !c.active });
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(null);
    }
  }

  const scope = (c) => {
    const parts = [];
    if (c.firstOrderOnly) parts.push(t("admin.coupons.first_order_short"));
    if (c.productIds.length) parts.push(t("admin.coupons.n_products", { count: c.productIds.length }));
    if (c.countries.length) parts.push(c.countries.join("/"));
    if (c.providerIds.length) parts.push(t("admin.coupons.n_providers", { count: c.providerIds.length }));
    return parts.length ? parts.join(" · ") : t("admin.coupons.everything");
  };

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <span className="fin-spacer" />
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t("admin.coupons.new")}</Button>
      </div>
      {err && <div className="fin-alert danger" role="alert">{err}</div>}
      {formOpen && (
        <CouponForm
          key={editing ? editing.id : "new"}
          editing={editing}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
          onSaved={() => { setFormOpen(false); setEditing(null); reload(); }}
        />
      )}
      {report && <Report coupon={report} onClose={() => setReport(null)} />}
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.coupons.none")}</Empty>
          ) : (
            data && (
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.coupons.code")}</th>
                      <th>{t("admin.coupons.value")}</th>
                      <th>{t("admin.coupons.scope")}</th>
                      <th>{t("admin.coupons.window")}</th>
                      <th className="num">{t("admin.coupons.uses")}</th>
                      <th className="num">{t("admin.coupons.discount_given")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((c) => (
                      <tr key={c.id} style={c.active ? undefined : { opacity: 0.55 }}>
                        <td className="mono">{c.code}{c.overrideFloor && <Badge tone="warning">{t("admin.coupons.below_floor_ok")}</Badge>}</td>
                        <td><Num>{c.type === "Percent" ? `${c.value}%` : fmtEgp(c.value)}</Num></td>
                        <td>{scope(c)}</td>
                        <td>
                          <Num>{c.startsAt ? cairoDate(c.startsAt) : "…"}</Num> → <Num>{c.endsAt ? cairoDate(c.endsAt) : "…"}</Num>
                        </td>
                        <td className="num"><Num>{c.uses}{c.maxUsesTotal ? ` / ${c.maxUsesTotal}` : ""}</Num></td>
                        <td className="num"><Num>{fmtEgp(c.discountGiven)}</Num></td>
                        <td><Badge tone={c.active ? "success" : "neutral"}>{c.active ? t("admin.products.active") : t("admin.products.disabled")}</Badge></td>
                        <td>
                          <div className="fin-row-actions">
                            <Button size="sm" variant="secondary" onClick={() => setReport(c)}>{t("admin.coupons.report")}</Button>
                            <Button size="sm" variant="secondary" onClick={() => { setEditing(c); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("admin.finance.edit")}</Button>
                            <Button size="sm" variant={c.active ? "danger" : "secondary"} disabled={busy === c.id} onClick={() => toggle(c)}>
                              {c.active ? t("admin.products.disable") : t("admin.products.enable")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </StateBox>
      </Card>
    </div>
  );
}
