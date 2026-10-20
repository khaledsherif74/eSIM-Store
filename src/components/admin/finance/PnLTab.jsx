import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Bars,
  CATEGORIES,
  Delta,
  MonthSelect,
  Num,
  StateBox,
  currentMonth,
  fmtEgp,
  fmtNum,
  fmtPct,
  shiftMonth,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

function fmtGrowth(v) {
  if (v === null || v === undefined) return "—";
  return `${v >= 0 ? "+" : "−"}${fmtNum(Math.abs(v), 1)}%`;
}

export function PnLTab() {
  const { t } = useTranslation();
  const [to, setTo] = useState(currentMonth());
  const [from, setFrom] = useState(shiftMonth(currentMonth(), -2));
  const rangeBad = from > to;
  const { data, loading, error, reload } = useAsync(
    () =>
      rangeBad ? Promise.resolve(null) : adminApi.getFinancePnl({ from, to }),
    [from, to],
  );

  const rows = [
    {
      k: "gross",
      label: "pnl_gross",
      get: (m) => fmtEgp(m.grossSales),
      cls: "head",
    },
    {
      k: "disc",
      label: "pnl_discounts",
      get: (m) => fmtEgp(-m.discounts),
      cls: "sub",
    },
    {
      k: "net",
      label: "net_sales",
      get: (m) => fmtEgp(m.netSales),
      cls: "total",
    },
    {
      k: "g_sales",
      label: "pnl_growth_sales",
      get: (m) => fmtGrowth(m.growth?.netSales),
      cls: "sub",
      noTotal: true,
    },
    { k: "cogs", label: "pnl_cogs", get: (m) => fmtEgp(-m.cogs), cls: "sub" },
    { k: "fees", label: "pnl_fees", get: (m) => fmtEgp(-m.fees), cls: "sub" },
    {
      k: "rfees",
      label: "pnl_refund_fees",
      get: (m) => fmtEgp(-m.refundFees),
      cls: "sub",
    },
    {
      k: "op",
      label: "order_profit",
      get: (m) => fmtEgp(m.orderProfit),
      cls: "total",
    },
    ...CATEGORIES.map((c) => ({
      k: `cat_${c}`,
      label: `cat_${c}`,
      get: (m) => fmtEgp(-(m.categories?.[c] ?? 0)),
      cls: "sub",
      totalGet: null,
    })),
    { k: "opex", label: "pnl_opex", get: (m) => fmtEgp(-m.opex), cls: "total" },
    {
      k: "ref",
      label: "pnl_rewards",
      get: (m) => fmtEgp(-m.referralRewards),
      cls: "sub",
    },
    {
      k: "np",
      label: "net_profit",
      get: (m) => fmtEgp(m.netProfit),
      cls: "head",
    },
    {
      k: "g_profit",
      label: "pnl_growth_profit",
      get: (m) => fmtGrowth(m.growth?.netProfit),
      cls: "sub",
      noTotal: true,
    },
    {
      k: "margin",
      label: "pnl_margin",
      get: (m) => fmtPct(m.netMarginPct),
      cls: "sub",
    },
    {
      k: "orders",
      label: "pnl_orders",
      get: (m) => `${fmtNum(m.delivered, 0)} / ${fmtNum(m.orders, 0)}`,
      cls: "",
    },
    {
      k: "avg",
      label: "avg_profit",
      get: (m) => fmtEgp(m.avgProfitPerOrder),
      cls: "",
    },
    {
      k: "be",
      label: "break_even",
      get: (m) => (m.breakEvenOrders ? fmtNum(m.breakEvenOrders, 0) : "—"),
      cls: "",
    },
    {
      k: "new",
      label: "pnl_new_customers",
      get: (m) => fmtNum(m.newCustomers, 0),
      cls: "",
    },
    { k: "cac", label: "cac", get: (m) => fmtEgp(m.cac), cls: "" },
  ];

  const totalCell = (row, d) => {
    if (row.noTotal) return "—";
    if (row.k.startsWith("cat_")) {
      const c = row.k.slice(4);
      return fmtEgp(
        -d.months.reduce((s, m) => s + (m.categories?.[c] ?? 0), 0),
      );
    }
    return row.get(d.totals);
  };

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.pnl_title")}</h1>
        <p>{t("admin.finance.pnl_sub")}</p>
      </div>
      <div className="fin-toolbar">
        <MonthSelect
          value={from}
          onChange={setFrom}
          label={t("admin.finance.from")}
        />
        <MonthSelect
          value={to}
          onChange={setTo}
          label={t("admin.finance.to")}
        />
      </div>
      {rangeBad && (
        <div className="fin-alert danger" role="alert">
          {t("admin.finance.range_invalid")}
        </div>
      )}
      {data && data.estimatedOrders > 0 && (
        <div className="fin-alert info" role="note">
          <Info size={16} />
          {t("admin.finance.estimated_notice", { count: data.estimatedOrders })}
        </div>
      )}
      {data && data.months.length > 1 && (
        <Card>
          <h2 className="fin-card-title">{t("admin.finance.pnl_trend")}</h2>
          <Bars
            rows={data.months.map((m) => ({
              key: m.month,
              label: m.month,
              value: m.netProfit,
              tone: "success",
            }))}
          />
          <p className="fin-note" style={{ marginBlockStart: 8 }}>
            {t("admin.finance.pnl_trend_last")}:{" "}
            <Delta
              value={data.months[data.months.length - 1].growth?.netProfit}
            />
          </p>
        </Card>
      )}
      <Card padded={false}>
        <StateBox loading={loading && !rangeBad} error={error} onRetry={reload}>
          {data && (
            <div className="fin-table-wrap">
              <table className="admin-orders-table fin-pnl">
                <thead>
                  <tr>
                    <th>{t("admin.finance.line")}</th>
                    {data.months.map((m) => (
                      <th className="num" key={m.month}>
                        <Num>{m.month}</Num>
                      </th>
                    ))}
                    {data.months.length > 1 && (
                      <th className="num">{t("admin.finance.total")}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.k} className={r.cls}>
                      <td>{t(`admin.finance.${r.label}`)}</td>
                      {data.months.map((m) => (
                        <td className="num" key={m.month}>
                          <Num>{r.get(m)}</Num>
                        </td>
                      ))}
                      {data.months.length > 1 && (
                        <td className="num">
                          <Num>{totalCell(r, data)}</Num>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StateBox>
      </Card>
    </div>
  );
}
