import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { STATUS_OPTIONS } from "../shared.jsx";
import { errorText, todayCairo } from "../../../components/admin/finance/financeUtils.jsx";

export function ReportsTab() {
  const { t } = useTranslation();
  const today = todayCairo();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function download(fn) {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.ops.reports_title")}</h2>
      <div className="fin-form">
        <label className="fin-field">
          <span>{t("admin.finance.from")}</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.to")}</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="fin-field">
          <span>{t("admin.ops.orders_status")}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || t("admin.finance.all")}</option>)}
          </select>
        </label>
        <p className="fin-note" style={{ gridColumn: "1 / -1" }}>{t("admin.ops.reports_note")}</p>
        {err && <p className="fin-form-error" role="alert">{err}</p>}
        <div className="fin-form-actions">
          <Button icon={<Download size={14} />} disabled={busy} onClick={() => download(() => adminApi.downloadOrdersReport({ from, to, status }))}>
            {t("admin.ops.orders_csv")}
          </Button>
          <Button variant="secondary" icon={<Download size={14} />} disabled={busy} onClick={() => download(() => adminApi.downloadSalesReport({ from, to }))}>
            {t("admin.ops.sales_csv")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
