import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Info, Lock, LockOpen } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { Badge } from "../../ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";
import {
  Bars,
  Delta,
  Kpi,
  MonthSelect,
  Num,
  StateBox,
  countryName,
  currentMonth,
  fmtEgp,
  fmtNum,
  fmtPct,
  fmtUsd,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

export function FinanceDashboard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [month, setMonth] = useState(currentMonth());
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getFinanceDashboard(month),
    [month],
  );

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.dashboard_title")}</h1>
        <p>{t("admin.finance.dashboard_sub")}</p>
      </div>

      <div className="fin-toolbar">
        <MonthSelect
          value={month}
          onChange={setMonth}
          label={t("admin.finance.month")}
        />
        {data && (
          <Badge tone={data.locked ? "warning" : "neutral"}>
            {data.locked ? <Lock size={12} /> : <LockOpen size={12} />}{" "}
            {data.locked
              ? t("admin.finance.locked")
              : t("admin.finance.open")}
          </Badge>
        )}
      </div>

      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && <DashboardBody data={data} t={t} language={language} />}
      </StateBox>
    </div>
  );
}

function DashboardBody({ data, t, language }) {
  const k = data.kpis;
  const profitTone = k.netProfit >= 0 ? "good" : "bad";
  const beRemaining = Math.max(0, k.breakEvenOrders - k.delivered);

  const alertText = (a) => {
    if (a.type === "low_supplier_balance") {
      return t(
        a.source === "live"
          ? "admin.finance.alert_low_live"
          : "admin.finance.alert_low_ledger",
        { balance: fmtUsd(a.balanceUsd), threshold: fmtUsd(a.thresholdUsd) },
      );
    }
    return t("admin.finance.alert_renewal", {
      name: a.name,
      days: a.daysLeft,
    });
  };

  return (
    <>
      {data.estimatedOrders > 0 && (
        <div className="fin-alert info" role="note">
          <Info size={16} />
          {t("admin.finance.estimated_notice", { count: data.estimatedOrders })}
        </div>
      )}
      {data.fx.source !== "live" && (
        <div className="fin-alert" role="note">
          <AlertTriangle size={16} />
          {t(
            data.fx.rate
              ? "admin.finance.fx_fallback"
              : "admin.finance.fx_unavailable",
          )}
        </div>
      )}
      {data.alerts.map((a, i) => (
        <div
          className={`fin-alert${a.type === "low_supplier_balance" ? " danger" : ""}`}
          key={`${a.type}-${a.source || a.expenseId || i}`}
          role="alert"
        >
          <AlertTriangle size={16} />
          {alertText(a)}
        </div>
      ))}

      <div className="fin-grid">
        <Kpi
          label={t("admin.finance.net_sales")}
          value={fmtEgp(k.netSales)}
          sub={<Delta value={k.deltas.netSales} />}
        />
        <Kpi
          label={t("admin.finance.delivered_orders")}
          value={fmtNum(k.delivered, 0)}
          sub={t("admin.finance.of_orders", { count: k.orders })}
        />
        <Kpi
          label={t("admin.finance.order_profit")}
          value={fmtEgp(k.orderProfit)}
          sub={<Delta value={k.deltas.orderProfit} />}
        />
        <Kpi
          label={t("admin.finance.opex_month")}
          value={fmtEgp(k.opex)}
          sub={<Delta value={k.deltas.opex} />}
        />
        <Kpi
          label={t("admin.finance.referral_rewards")}
          value={fmtEgp(k.referralRewards)}
        />
        <Kpi
          label={t("admin.finance.net_profit")}
          value={fmtEgp(k.netProfit)}
          tone={profitTone}
          sub={
            <>
              <Delta value={k.deltas.netProfit} />{" "}
              {k.netMarginPct !== null && (
                <Num>{fmtPct(k.netMarginPct)}</Num>
              )}
            </>
          }
        />
        <Kpi
          label={t("admin.finance.break_even")}
          value={k.breakEvenOrders ? fmtNum(k.breakEvenOrders, 0) : "—"}
          sub={
            k.breakEvenOrders
              ? beRemaining === 0
                ? t("admin.finance.break_even_passed")
                : t("admin.finance.break_even_remaining", {
                    count: beRemaining,
                  })
              : t("admin.finance.break_even_na")
          }
        />
        <Kpi
          label={t("admin.finance.avg_profit")}
          value={fmtEgp(k.avgProfitPerOrder)}
        />
        <Kpi
          label={t("admin.finance.cac")}
          value={fmtEgp(k.cac)}
          sub={t("admin.finance.new_returning", {
            new: k.newCustomers,
            returning: k.returningCustomers,
          })}
        />
        <Kpi
          label={t("admin.finance.supplier_balance")}
          value={fmtUsd(data.supplier.ledger.balanceUsd)}
          tone={data.supplier.ledger.low ? "bad" : undefined}
          sub={
            data.supplier.live.available
              ? t("admin.finance.live_balance_short", {
                  balance: fmtUsd(data.supplier.live.balanceUsd),
                })
              : t("admin.finance.live_unavailable")
          }
        />
      </div>

      <div className="fin-grid-2">
        <Card>
          <h2 className="fin-card-title">{t("admin.finance.sales_profit_3m")}</h2>
          <div className="fin-series">
            {data.series.map((m) => (
              <div key={m.month}>
                <strong>
                  <Num>{m.month}</Num>
                </strong>
                <Bars
                  rows={[
                    {
                      key: "s",
                      label: t("admin.finance.sales"),
                      value: m.netSales,
                    },
                    {
                      key: "p",
                      label: t("admin.finance.net_profit_short"),
                      value: m.netProfit,
                      tone: "success",
                    },
                  ]}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="fin-card-title">{t("admin.finance.by_category")}</h2>
          {data.categories.length === 0 ? (
            <p className="fin-note">{t("admin.finance.no_expenses_month")}</p>
          ) : (
            <Bars
              rows={data.categories.map((c) => ({
                key: c.category,
                label: t(`admin.finance.cat_${c.category}`),
                value: c.amount,
                tone: "warning",
              }))}
            />
          )}
          <p className="fin-note" style={{ marginBlockStart: 12 }}>
            {t("admin.finance.vs_previous")}: <Num>{fmtEgp(data.previousOpex)}</Num>{" "}
            <Delta value={k.deltas.opex} />
          </p>
        </Card>

        <Card>
          <h2 className="fin-card-title">{t("admin.finance.top_countries")}</h2>
          {data.topCountries.length === 0 ? (
            <p className="fin-note">{t("admin.finance.no_sales_month")}</p>
          ) : (
            <Bars
              format={(v) => fmtNum(v, 0)}
              rows={data.topCountries.map((c) => ({
                key: c.key,
                label:
                  countryName(c.key, language) ||
                  t(`admin.finance.country_${c.key}`),
                value: c.count,
              }))}
            />
          )}
        </Card>

        <Card>
          <h2 className="fin-card-title">{t("admin.finance.top_packages")}</h2>
          {data.topPackages.length === 0 ? (
            <p className="fin-note">{t("admin.finance.no_sales_month")}</p>
          ) : (
            <Bars
              format={(v) => fmtNum(v, 0)}
              rows={data.topPackages.map((p) => ({
                key: p.productId,
                label: p.title,
                value: p.count,
              }))}
            />
          )}
        </Card>
      </div>
    </>
  );
}
