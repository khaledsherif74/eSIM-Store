import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AlertTriangle, Info } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { adminApi } from "../../services/adminApi.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { PackageDetailsModal } from "../../components/admin/PackageDetailsModal.jsx";
import {
  Bars,
  Delta,
  Num,
  StateBox,
  countryName,
  fmtEgp,
  fmtNum,
  fmtUsd,
  useAsync,
} from "../../components/admin/finance/financeUtils.jsx";
import "../../components/admin/finance/finance.css";

function packageLabel(p) {
  if (p.dataLimit && p.dataUnit && p.validityDays) {
    return `${fmtNum(p.dataLimit, p.dataLimit % 1 ? 1 : 0)}${p.dataUnit} · ${p.validityDays}d`;
  }
  return p.title;
}

function Kpi({ tone, label, value, metric, t }) {
  return (
    <div className={`ash-kpi ${tone}`}>
      <span className="ash-kpi-label">{label}</span>
      <strong className="ash-kpi-value">
        <Num>{value}</Num>
      </strong>
      <span className="ash-kpi-sub">
        <Delta value={metric.changePct} />{" "}
        {metric.changePct !== null && t("admin.overview.vs_yesterday")}
      </span>
    </div>
  );
}

export function OverviewPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getOverview(),
    [],
  );

  return (
    <section className="admin-section fin-wrap">
      <header className="admin-section-head">
        <h1>{t("admin.overview.title")}</h1>
        <p>{t("admin.overview.sub")}</p>
      </header>

      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && <Body data={data} t={t} language={language} />}
      </StateBox>
    </section>
  );
}

function Body({ data, t, language }) {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const k = data.kpis;
  const s = data.supplier;
  const lowLedger = s.ledger.low;
  const lowLive = s.live.available && s.live.low;
  const be = data.breakEven;

  return (
    <>
      {data.estimatedOrders > 0 && (
        <div className="fin-alert info" role="note">
          <Info size={16} />
          {t("admin.finance.estimated_notice", { count: data.estimatedOrders })}
        </div>
      )}

      <div className="ash-kpis">
        <Kpi
          t={t}
          tone="green"
          label={t("admin.overview.kpi_sales_today")}
          value={fmtEgp(k.salesToday.value)}
          metric={k.salesToday}
        />
        <Kpi
          t={t}
          tone="blue"
          label={t("admin.overview.kpi_orders_today")}
          value={fmtNum(k.ordersToday.value, 0)}
          metric={k.ordersToday}
        />
        <Kpi
          t={t}
          tone="purple"
          label={t("admin.overview.kpi_net_profit")}
          value={fmtEgp(k.netProfit.value)}
          metric={k.netProfit}
        />
        <Kpi
          t={t}
          tone="orange"
          label={t("admin.overview.kpi_new_users")}
          value={fmtNum(k.newUsers.value, 0)}
          metric={k.newUsers}
        />
        <Kpi
          t={t}
          tone="pink"
          label={t("admin.overview.kpi_returning")}
          value={fmtNum(k.returningCustomers.value, 0)}
          metric={k.returningCustomers}
        />
      </div>

      <div className="fin-grid-2">
        <Card>
          <h2 className="fin-card-title">
            {t("admin.overview.top_countries")}
          </h2>
          {data.topCountries.length === 0 ? (
            <p className="fin-note">{t("admin.overview.no_data")}</p>
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
          <h2 className="fin-card-title">{t("admin.overview.top_packages")}</h2>
          {data.topPackages.length === 0 ? (
            <p className="fin-note">{t("admin.overview.no_data")}</p>
          ) : (
            <Bars
              format={(v) => fmtNum(v, 0)}
              rows={data.topPackages.map((p) => ({
                key: p.productId,
                label: packageLabel(p),
                value: p.count,
                onClick: () => setSelectedPkg(p),
              }))}
            />
          )}
          {data.topPackages.length > 0 && (
            <p className="fin-note" style={{ marginBlockStart: 8 }}>
              {t("admin.package_details.click_hint")}
            </p>
          )}
        </Card>

        <Card>
          <h2 className="fin-card-title">
            {t("admin.overview.supplier_balance")}
          </h2>
          <div className="fin-grid">
            <div>
              <span className="fin-sub">{t("admin.overview.ledger")}</span>
              <strong style={{ fontSize: 24 }}>
                <Num>{fmtUsd(s.ledger.balanceUsd)}</Num>
              </strong>
            </div>
            <div>
              <span className="fin-sub">{t("admin.overview.live")}</span>
              <strong style={{ fontSize: 24 }}>
                <Num>{s.live.available ? fmtUsd(s.live.balanceUsd) : "—"}</Num>
              </strong>
              {!s.live.available && (
                <span className="fin-sub">
                  {t("admin.finance.live_unavailable")}
                </span>
              )}
            </div>
          </div>
          {(lowLedger || lowLive) && (
            <div
              className="fin-alert danger"
              role="alert"
              style={{ marginBlockStart: 12 }}
            >
              <AlertTriangle size={16} />
              {t("admin.overview.low_warning", {
                threshold: fmtUsd(s.ledger.thresholdUsd),
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="fin-card-title">{t("admin.overview.opex_title")}</h2>
          <strong style={{ fontSize: 28 }}>
            <Num>{fmtEgp(data.operatingCosts.amount)}</Num>
          </strong>
          <p className="fin-note" style={{ marginBlockStart: 8 }}>
            <Num>{data.operatingCosts.month}</Num>
          </p>
          <Link to="/finance/expenses" className="fin-link">
            {t("admin.overview.open_finance")}
          </Link>
        </Card>

        <Card>
          <h2 className="fin-card-title">
            {t("admin.overview.break_even_title")}
          </h2>
          {be.orders > 0 ? (
            <>
              <strong style={{ fontSize: 28 }}>
                {t("admin.overview.break_even_orders", { count: be.orders })}
              </strong>
              <div
                className="fin-bar-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(be.progressPct ?? 0)}
                style={{ marginBlock: 12, blockSize: 14 }}
              >
                <span
                  className="fin-bar-fill success"
                  style={{ inlineSize: `${be.progressPct ?? 0}%` }}
                />
              </div>
              <p className="fin-note">
                <Badge tone={be.progressPct >= 100 ? "success" : "neutral"}>
                  <Num>{fmtNum(be.progressPct ?? 0, 0)}%</Num>
                </Badge>{" "}
                {t("admin.overview.break_even_progress", {
                  delivered: be.delivered,
                  target: be.orders,
                })}
              </p>
            </>
          ) : (
            <p className="fin-note">{t("admin.overview.break_even_na")}</p>
          )}
        </Card>
      </div>

      {selectedPkg && (
        <PackageDetailsModal
          pkg={selectedPkg}
          onClose={() => setSelectedPkg(null)}
        />
      )}
    </>
  );
}
