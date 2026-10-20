import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, errorText, fmtEgp, useAsync } from "../../../components/admin/finance/financeUtils.jsx";
import { cairoDate, fromList, toList } from "./couponUtils.js";

const blank = () => ({ name: "", discountType: "Percent", value: "10", productIds: "", startsAt: "", endsAt: "", active: true });
const fromOffer = (o) => ({
  name: o.name,
  discountType: o.discountType,
  value: String(o.value),
  productIds: fromList(o.productIds),
  startsAt: cairoDate(o.startsAt),
  endsAt: cairoDate(o.endsAt),
  active: o.active,
});
const toPayload = (f) => ({
  name: f.name,
  discountType: f.discountType,
  value: f.value === "" ? "" : Number(f.value),
  productIds: toList(f.productIds),
  startsAt: f.startsAt || null,
  endsAt: f.endsAt || null,
  active: f.active,
});

function OfferForm({ editing, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [f, setF] = useState(editing ? fromOffer(editing) : blank());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function save() {
    setSaving(true);
    setErr("");
    try {
      if (editing) await adminApi.updateOffer(editing.id, toPayload(f));
      else await adminApi.createOffer(toPayload(f));
      onSaved();
    } catch (e) {
      setErr(errorText(e, t));
      setSaving(false);
    }
  }

  return (
    <Card>
      <h2 className="fin-card-title">{editing ? t("admin.coupons.edit_offer") : t("admin.coupons.new_offer")}</h2>
      <div className="fin-form">
        <label className="fin-field">
          <span>{t("admin.coupons.offer_name")}</span>
          <input value={f.name} onChange={set("name")} maxLength={100} />
        </label>
        <label className="fin-field">
          <span>{t("admin.coupons.type")}</span>
          <select value={f.discountType} onChange={set("discountType")}>
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
          <span>{t("admin.coupons.products")}</span>
          <input dir="ltr" value={f.productIds} onChange={set("productIds")} placeholder={t("admin.coupons.offer_all_hint")} />
        </label>
        <label className="fin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={f.active} onChange={set("active")} />
          <span>{t("admin.products.active")}</span>
        </label>
        <p className="fin-note" style={{ gridColumn: "1 / -1" }}>{t("admin.coupons.offer_note")}</p>
        {err && <p className="fin-form-error" role="alert">{err}</p>}
        <div className="fin-form-actions">
          <Button onClick={save} disabled={saving}>{t("admin.finance.save")}</Button>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>{t("admin.finance.cancel")}</Button>
        </div>
      </div>
    </Card>
  );
}

export function OffersTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.listOffers(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  async function toggle(o) {
    setBusy(o.id);
    setErr("");
    try {
      await adminApi.updateOffer(o.id, { active: !o.active });
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <span className="fin-spacer" />
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t("admin.coupons.new_offer")}</Button>
      </div>
      {err && <div className="fin-alert danger" role="alert">{err}</div>}
      {formOpen && (
        <OfferForm
          key={editing ? editing.id : "new"}
          editing={editing}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
          onSaved={() => { setFormOpen(false); setEditing(null); reload(); }}
        />
      )}
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.coupons.no_offers")}</Empty>
          ) : (
            data && (
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.coupons.offer_name")}</th>
                      <th>{t("admin.coupons.value")}</th>
                      <th>{t("admin.coupons.scope")}</th>
                      <th>{t("admin.coupons.window")}</th>
                      <th className="num">{t("admin.coupons.orders")}</th>
                      <th className="num">{t("admin.coupons.revenue")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((o) => (
                      <tr key={o.id} style={o.active ? undefined : { opacity: 0.55 }}>
                        <td>{o.name}</td>
                        <td><Num>{o.discountType === "Percent" ? `${o.value}%` : fmtEgp(o.value)}</Num></td>
                        <td>{o.productIds.length ? t("admin.coupons.n_products", { count: o.productIds.length }) : t("admin.coupons.everything")}</td>
                        <td><Num>{o.startsAt ? cairoDate(o.startsAt) : "…"}</Num> → <Num>{o.endsAt ? cairoDate(o.endsAt) : "…"}</Num></td>
                        <td className="num"><Num>{o.orders}</Num></td>
                        <td className="num"><Num>{fmtEgp(o.revenue)}</Num></td>
                        <td><Badge tone={o.active ? "success" : "neutral"}>{o.active ? t("admin.products.active") : t("admin.products.disabled")}</Badge></td>
                        <td>
                          <div className="fin-row-actions">
                            <Button size="sm" variant="secondary" onClick={() => { setEditing(o); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{t("admin.finance.edit")}</Button>
                            <Button size="sm" variant={o.active ? "danger" : "secondary"} disabled={busy === o.id} onClick={() => toggle(o)}>
                              {o.active ? t("admin.products.disable") : t("admin.products.enable")}
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
