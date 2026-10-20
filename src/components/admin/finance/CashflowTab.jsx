import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Bars, Kpi, MonthSelect, Num, StateBox, currentMonth, fmtEgp, shiftMonth, useAsync } from "./financeUtils.jsx";
import "./finance.css";

const IN_ROWS = ["cardIn", "walletTopups"];
const OUT_ROWS = ["supplierTopups", "expenses", "refunds", "gatewayFees"];

export function CashflowTab() {
  const { t } = useTranslation();
  const [to, setTo] = useState(currentMonth());
  const [from, setFrom] = useState(shiftMonth(currentMonth(), -5));
  const bad = from > to;
  const { data, loading, error, reload } = useAsync(
    () => (bad ? Promise.resolve(null) : adminApi.getFinanceCashflow({ from, to })),
    [from, to],
  );

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("finance.cashflow.title")}</h1>
        <p>{t("finance.cashflow.sub")}</p>
      </div>
      <div className="fin-toolbar">
        <MonthSelect value={from} onChange={setFrom} label={t("admin.finance.from")} />
        <MonthSelect value={to} onChange={setTo} label={t("admin.finance.to")} />
      </div>
      {bad && <div className="fin-alert danger" role="alert">{t("admin.finance.range_invalid")}</div>}

      <StateBox loading={loading && !bad} error={error} onRetry={reload}>
        {data && (
          <>
            {(data.fxApproximate || data.estimatedOrders > 0) && (
              <div className="fin-alert info" role="note">
                <Info size={16} />
                {data.fxApproximate && t("finance.cashflow.fx_note", { rate: data.fx.rate ? data.fx.rate : "—" })}{" "}
                {data.estimatedOrders > 0 && t("admin.finance.estimated_notice", { count: data.estimatedOrders })}
              </div>
            )}

            <div className="fin-grid">
              <Kpi label={t("finance.cashflow.inflows")} value={fmtEgp(data.totals.inflows)} tone="good" />
              <Kpi label={t("finance.cashflow.outflows")} value={fmtEgp(data.totals.outflows)} />
              <Kpi label={t("finance.cashflow.net")} value={fmtEgp(data.totals.net)} tone={data.totals.net >= 0 ? "good" : "bad"} />
            </div>

            <Card>
              <h2 className="fin-card-title">{t("finance.cashflow.chart")}</h2>
              <div className="fin-series">
                {data.months.map((m) => (
                  <div key={m.month}>
                    <strong><Num>{m.month}</Num></strong>
                    <Bars
                      rows={[
                        { key: "in", label: t("finance.cashflow.inflows"), value: m.inflows, tone: "success" },
                        { key: "out", label: t("finance.cashflow.outflows"), value: m.outflows, tone: "warning" },
                        { key: "net", label: t("finance.cashflow.net"), value: m.net },
                      ]}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Card padded={false}>
              <div className="fin-table-wrap">
                <table className="admin-orders-table fin-pnl">
                  <thead>
                    <tr>
                      <th>{t("admin.finance.line")}</th>
                      {data.months.map((m) => <th className="num" key={m.month}><Num>{m.month}</Num></th>)}
                      {data.months.length > 1 && <th className="num">{t("admin.finance.total")}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...IN_ROWS.map((k) => ({ k, cls: "sub", sign: 1 })),
                      { k: "inflows", cls: "total", sign: 1 },
                      ...OUT_ROWS.map((k) => ({ k, cls: "sub", sign: -1 })),
                      { k: "outflows", cls: "total", sign: -1 },
                      { k: "net", cls: "head", sign: 1 },
                    ].map((r) => (
                      <tr key={r.k} className={r.cls}>
                        <td>{t(`finance.cashflow.row_${r.k}`)}</td>
                        {data.months.map((m) => <td className="num" key={m.month}><Num>{fmtEgp(r.sign * m[r.k])}</Num></td>)}
                        {data.months.length > 1 && <td className="num"><Num>{fmtEgp(r.sign * data.totals[r.k])}</Num></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <p className="fin-note">{t("finance.cashflow.note")}</p>
          </>
        )}
      </StateBox>
    </div>
  );
}
