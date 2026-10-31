import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  StateBox,
  errorText,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";

const FIELDS = [
  { key: "referralRewardAmount", step: "0.01", label: "reward_amount" },
  { key: "referralMinFirstOrderUsd", step: "0.01", label: "min_first_order" },
  { key: "rewardExpiryDays", step: "1", label: "expiry_days" },
];

export function ReferralSettingsTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getReferralSettings(),
    [],
  );
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (data)
      setForm(
        Object.fromEntries(FIELDS.map((f) => [f.key, String(data[f.key])])),
      );
  }, [data]);

  async function save() {
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.updateReferralSettings(
        Object.fromEntries(
          FIELDS.map((f) => [
            f.key,
            form[f.key] === "" ? "" : Number(form[f.key]),
          ]),
        ),
      );
      setMsg({ type: "ok", text: t("admin.referrals.settings_saved") });
      reload();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setSaving(false);
    }
  }
  async function runExpiry() {
    if (!window.confirm(t("admin.referrals.expiry_confirm"))) return;
    setMsg({ type: "", text: "" });
    try {
      const r = await adminApi.runRewardExpiry();
      setMsg({
        type: "ok",
        text: r.enabled
          ? t("admin.referrals.expiry_done", {
              count: r.expired,
              amount: r.amountUsd,
            })
          : t("admin.referrals.expiry_off"),
      });
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    }
  }

  return (
    <div className="fin-wrap">
      <Card>
        <h2 className="fin-card-title">
          {t("admin.referrals.settings_title")}
        </h2>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {form && (
            <div className="fin-form">
              {FIELDS.map((f) => (
                <label className="fin-field" key={f.key}>
                  <span>{t(`admin.referrals.${f.label}`)}</span>
                  <input
                    type="number"
                    min="0"
                    step={f.step}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm((x) => ({ ...x, [f.key]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
                {t("admin.referrals.settings_note")}
              </p>
              {msg.text && (
                <p
                  className={msg.type === "err" ? "fin-form-error" : "fin-note"}
                  role={msg.type === "err" ? "alert" : "status"}
                >
                  {msg.text}
                </p>
              )}
              <div className="fin-form-actions">
                <Button onClick={save} disabled={saving}>
                  {t("admin.finance.save")}
                </Button>
                <Button variant="secondary" onClick={runExpiry}>
                  {t("admin.referrals.run_expiry")}
                </Button>
              </div>
            </div>
          )}
        </StateBox>
      </Card>
    </div>
  );
}
