import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, errorText, fmtEgp, fmtPct, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const SCOPES = ["Package", "Provider", "Country", "Global"];
const BLANK = { scopeType: "Global", scopeValue: "", markupType: "Percent", markupValue: "30", priority: "0" };

function Preview({ form, previewProduct, previewCost }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: false, data: null, error: null });
  useEffect(() => {
    if (form.markupValue === "" || (form.scopeType !== "Global" && !form.scopeValue.trim())) {
      setState({ loading: false, data: null, error: null });
      return undefined;
    }
    let alive = true;
    const id = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const body = {
          rule: { ...form, markupValue: Number(form.markupValue), priority: Number(form.priority || 0) },
          ...(previewProduct ? { productId: previewProduct } : { cost: Number(previewCost) }),
        };
        const data = await adminApi.previewPricing(body);
        if (alive) setState({ loading: false, data, error: null });
      } catch (error) {
        if (alive) setState({ loading: false, data: null, error });
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [form, previewProduct, previewCost]);

  if (state.error) return <p className="fin-form-error">{errorText(state.error, t)}</p>;
  if (!state.data) return <p className="fin-note">{t("admin.products.preview_hint")}</p>;
  const d = state.data;
  const row = (label, r) => (
    <div>
      <span className="fin-sub">{label}</span>
      <strong style={{ fontSize: 20 }}><Num>{fmtUsd(r.price)}</Num></strong>
      {r.margin && (
        <span className="fin-sub">
          <Num>{fmtEgp(r.margin.profitEgp)}</Num> · <Num>{fmtPct(r.margin.marginPct)}</Num>
        </span>
      )}
      {r.floored && <Badge tone="warning">{t("admin.products.floored")}</Badge>}
    </div>
  );
  return (
    <div className="fin-grid">
      <div>
        <span className="fin-sub">{t("admin.products.cost")}</span>
        <strong style={{ fontSize: 20 }}><Num>{fmtUsd(d.cost)}</Num></strong>
      </div>
      {row(t("admin.products.current_price"), d.current)}
      {row(t("admin.products.price_with_rule"), d.withRule)}
    </div>
  );
}

export function RulesTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.listPricingRules(), []);
  const [form, setForm] = useState(BLANK);
  const [previewProduct, setPreviewProduct] = useState("");
  const [previewCost, setPreviewCost] = useState("5");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [rowBusy, setRowBusy] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function create() {
    setSaving(true);
    setFormError("");
    try {
      await adminApi.createPricingRule({
        ...form,
        scopeValue: form.scopeType === "Global" ? null : form.scopeValue,
        markupValue: form.markupValue === "" ? "" : Number(form.markupValue),
        priority: Number(form.priority || 0),
      });
      setForm(BLANK);
      reload();
    } catch (e) {
      setFormError(errorText(e, t));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r) {
    setRowBusy(r.id);
    try {
      await adminApi.updatePricingRule(r.id, { active: !r.active });
      reload();
    } catch (e) {
      setFormError(errorText(e, t));
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="fin-wrap">
      <Card>
        <h2 className="fin-card-title">{t("admin.products.new_rule")}</h2>
        <p className="fin-note" style={{ marginBlockEnd: 12 }}>{t("admin.products.rules_order_note")}</p>
        <div className="fin-form">
          <label className="fin-field">
            <span>{t("admin.products.scope")}</span>
            <select value={form.scopeType} onChange={set("scopeType")}>
              {SCOPES.map((s) => <option key={s} value={s}>{t(`admin.products.scope_${s}`)}</option>)}
            </select>
          </label>
          <label className="fin-field">
            <span>{t("admin.products.scope_value")}</span>
            <input dir="ltr" value={form.scopeValue} onChange={set("scopeValue")} disabled={form.scopeType === "Global"} placeholder={t(`admin.products.hint_${form.scopeType}`)} />
          </label>
          <label className="fin-field">
            <span>{t("admin.products.markup_type")}</span>
            <select value={form.markupType} onChange={set("markupType")}>
              <option value="Percent">{t("admin.products.markup_percent")}</option>
              <option value="Fixed">{t("admin.products.markup_fixed")}</option>
            </select>
          </label>
          <label className="fin-field">
            <span>{t("admin.products.markup_value")}</span>
            <input type="number" min="0" step="0.01" value={form.markupValue} onChange={set("markupValue")} />
          </label>
          <label className="fin-field">
            <span>{t("admin.products.priority")}</span>
            <input type="number" step="1" value={form.priority} onChange={set("priority")} />
          </label>
          <div className="fin-form-actions" style={{ alignItems: "flex-end" }}>
            <Button onClick={create} disabled={saving}>{t("admin.products.create_rule")}</Button>
          </div>
          {formError && <p className="fin-form-error" role="alert">{formError}</p>}
        </div>
        <h3 className="fin-card-title" style={{ marginBlockStart: 16 }}>{t("admin.products.live_preview")}</h3>
        <div className="fin-form" style={{ marginBlockEnd: 12 }}>
          <label className="fin-field">
            <span>{t("admin.products.preview_product")}</span>
            <input dir="ltr" value={previewProduct} onChange={(e) => setPreviewProduct(e.target.value.trim())} placeholder="productId" />
          </label>
          {!previewProduct && (
            <label className="fin-field">
              <span>{t("admin.products.preview_cost")}</span>
              <input type="number" min="0" step="0.01" value={previewCost} onChange={(e) => setPreviewCost(e.target.value)} />
            </label>
          )}
        </div>
        <Preview form={form} previewProduct={previewProduct} previewCost={previewCost} />
      </Card>

      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.products.no_rules")}</Empty>
          ) : (
            data && (
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.products.scope")}</th>
                      <th>{t("admin.products.scope_value")}</th>
                      <th>{t("admin.products.markup_type")}</th>
                      <th className="num">{t("admin.products.markup_value")}</th>
                      <th className="num">{t("admin.products.priority")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((r) => (
                      <tr key={r.id} style={r.active ? undefined : { opacity: 0.55 }}>
                        <td>{t(`admin.products.scope_${r.scopeType}`)}</td>
                        <td dir="ltr">{r.scopeValue || "—"}</td>
                        <td>{r.markupType === "Percent" ? t("admin.products.markup_percent") : t("admin.products.markup_fixed")}</td>
                        <td className="num"><Num>{r.markupType === "Percent" ? `${r.markupValue}%` : fmtUsd(r.markupValue)}</Num></td>
                        <td className="num"><Num>{r.priority}</Num></td>
                        <td><Badge tone={r.active ? "success" : "neutral"}>{r.active ? t("admin.products.active") : t("admin.products.disabled")}</Badge></td>
                        <td>
                          <Button size="sm" variant="secondary" disabled={rowBusy === r.id} onClick={() => toggleActive(r)}>
                            {r.active ? t("admin.products.disable") : t("admin.products.enable")}
                          </Button>
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
