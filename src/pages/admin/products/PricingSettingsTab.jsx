import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { StateBox, errorText, fmtNum, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

export function PricingSettingsTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.getPricingSettings(), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({ markupPercent: String(data.markupPercent), minProfitEgp: String(data.minProfitEgp), roundTo99: data.roundTo99 });
    }
  }, [data]);

  async function save() {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.updatePricingSettings({
        markupPercent: form.markupPercent === "" ? "" : Number(form.markupPercent),
        minProfitEgp: form.minProfitEgp === "" ? "" : Number(form.minProfitEgp),
        roundTo99: form.roundTo99,
      });
      setMsg({ type: "ok", text: t("admin.products.settings_saved") });
      reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setSaving(false);
    }
  }

  async function recompute() {
    if (!window.confirm(t("admin.products.recompute_confirm"))) return;
    setRecomputing(true);
    setMsg({ type: "", text: "" });
    try {
      const r = await adminApi.recomputePrices();
      setMsg({ type: "ok", text: t("admin.products.recompute_done", { updated: r.updated, total: r.total }) });
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setRecomputing(false);
    }
  }

  return (
    <div className="fin-wrap">
      <Card>
        <h2 className="fin-card-title">{t("admin.products.pricing_settings")}</h2>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {form && (
            <div className="fin-form">
              <label className="fin-field">
                <span>{t("admin.products.global_markup")}</span>
                <input type="number" min="0" step="0.01" value={form.markupPercent} onChange={(e) => setForm((f) => ({ ...f, markupPercent: e.target.value }))} />
              </label>
              <label className="fin-field">
                <span>{t("admin.products.min_profit")}</span>
                <input type="number" min="0" step="0.5" value={form.minProfitEgp} onChange={(e) => setForm((f) => ({ ...f, minProfitEgp: e.target.value }))} />
              </label>
              <label className="fin-field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.roundTo99} onChange={(e) => setForm((f) => ({ ...f, roundTo99: e.target.checked }))} />
                <span>{t("admin.products.round_99")}</span>
              </label>
              <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
                {t("admin.products.fx_note", { rate: data.fx.rate ? fmtNum(data.fx.rate, 2) : "—" })}{" "}
                <Link to="/admin/operations?tab=secrets" className="fin-link">{t("admin.products.fx_link")}</Link>
              </p>
              <p className="fin-note" style={{ gridColumn: "1 / -1" }}>{t("admin.products.recompute_auto_note")}</p>
              {msg.text && <p className={msg.type === "err" ? "fin-form-error" : "fin-note"} role={msg.type === "err" ? "alert" : "status"}>{msg.text}</p>}
              <div className="fin-form-actions">
                <Button onClick={save} disabled={saving}>{t("admin.finance.save")}</Button>
                <Button variant="secondary" onClick={recompute} disabled={recomputing}>{t("admin.products.recompute")}</Button>
              </div>
            </div>
          )}
        </StateBox>
      </Card>
    </div>
  );
}
