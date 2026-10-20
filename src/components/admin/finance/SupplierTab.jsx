import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { Button } from "../../ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Empty,
  Kpi,
  Num,
  StateBox,
  errorText,
  fmtUsd,
  todayCairo,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

export function SupplierTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getFinanceSupplier(),
    [],
  );
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(todayCairo());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit() {
    setSaving(true);
    setFormError("");
    try {
      await adminApi.createSupplierTopup({
        amountUsd: amount === "" ? "" : Number(amount),
        paidAt,
        note,
      });
      setAmount("");
      setNote("");
      reload();
    } catch (err) {
      setFormError(errorText(err, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.supplier_title")}</h1>
        <p>{t("admin.finance.supplier_sub")}</p>
      </div>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {(data.ledger.low || data.live.low) && (
              <div className="fin-alert danger" role="alert">
                <AlertTriangle size={16} />
                {t("admin.finance.alert_low_ledger", {
                  balance: fmtUsd(data.live.low ? data.live.balanceUsd : data.ledger.balanceUsd),
                  threshold: fmtUsd(data.ledger.thresholdUsd),
                })}
              </div>
            )}
            <div className="fin-grid">
              <Kpi label={t("admin.finance.total_topups")} value={fmtUsd(data.ledger.totalTopupsUsd)} />
              <Kpi label={t("admin.finance.used_in_orders")} value={fmtUsd(data.ledger.usedUsd)} />
              <Kpi
                label={t("admin.finance.ledger_balance")}
                value={fmtUsd(data.ledger.balanceUsd)}
                tone={data.ledger.low ? "bad" : "good"}
              />
              <Kpi
                label={t("admin.finance.live_balance")}
                value={data.live.available ? fmtUsd(data.live.balanceUsd) : "—"}
                tone={data.live.available ? (data.live.low ? "bad" : "good") : undefined}
                sub={data.live.available ? null : t("admin.finance.live_unavailable")}
              />
            </div>

            <Card>
              <h2 className="fin-card-title">{t("admin.finance.record_topup")}</h2>
              <p className="fin-note" style={{ marginBlockEnd: 12 }}>
                {t("admin.finance.topup_not_expense")}
              </p>
              <div className="fin-form">
                <label className="fin-field">
                  <span>{t("admin.finance.topup_amount")}</span>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                <label className="fin-field">
                  <span>{t("admin.finance.f_paid_at")}</span>
                  <input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
                </label>
                <label className="fin-field">
                  <span>{t("admin.finance.f_note")}</span>
                  <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
                </label>
                {formError && <p className="fin-form-error" role="alert">{formError}</p>}
                <div className="fin-form-actions">
                  <Button onClick={submit} disabled={saving}>{t("admin.finance.record")}</Button>
                </div>
              </div>
            </Card>

            <Card padded={false}>
              {data.topups.length === 0 ? (
                <Empty>{t("admin.finance.no_topups")}</Empty>
              ) : (
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.f_paid_at")}</th>
                        <th className="num">{t("admin.finance.topup_amount")}</th>
                        <th>{t("admin.finance.f_note")}</th>
                        <th>{t("admin.finance.by")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topups.map((x) => (
                        <tr key={x.id}>
                          <td><Num>{String(x.paidAt).slice(0, 10)}</Num></td>
                          <td className="num"><Num>{fmtUsd(x.amountUsd)}</Num></td>
                          <td>{x.note || "—"}</td>
                          <td>{x.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </StateBox>
    </div>
  );
}
