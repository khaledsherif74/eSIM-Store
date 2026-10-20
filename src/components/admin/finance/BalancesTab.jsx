import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Kpi, Num, StateBox, fmtEgp, fmtNum, fmtUsd, useAsync } from "./financeUtils.jsx";
import "./finance.css";

export function BalancesTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.getFinanceBalances(), []);
  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("finance.balances.title")}</h1>
        <p>{t("finance.balances.sub")}</p>
      </div>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {data.alerts.map((a, i) => (
              <div className="fin-alert danger" role="alert" key={`${a.type}-${a.source || i}`}>
                <AlertTriangle size={16} />
                {a.type === "negative_ledger"
                  ? t("finance.balances.alert_negative", { balance: fmtUsd(a.balanceUsd) })
                  : t(a.source === "live" ? "admin.finance.alert_low_live" : "admin.finance.alert_low_ledger", {
                      balance: fmtUsd(a.balanceUsd),
                      threshold: fmtUsd(a.thresholdUsd),
                    })}
              </div>
            ))}

            <div className="fin-grid">
              <Kpi
                label={t("finance.balances.supplier_ledger")}
                value={fmtUsd(data.supplier.ledger.balanceUsd)}
                tone={data.supplier.ledger.low ? "bad" : "good"}
                sub={t("finance.balances.threshold", { threshold: fmtUsd(data.supplier.ledger.thresholdUsd) })}
              />
              <Kpi
                label={t("finance.balances.supplier_live")}
                value={data.supplier.live.available ? fmtUsd(data.supplier.live.balanceUsd) : "—"}
                tone={data.supplier.live.available ? (data.supplier.live.low ? "bad" : "good") : undefined}
                sub={data.supplier.live.available ? null : t("admin.finance.live_unavailable")}
              />
              <Kpi
                label={t("finance.balances.wallet_liability")}
                value={fmtUsd(data.wallets.liabilityUsd)}
                sub={
                  <>
                    {data.wallets.liabilityEgp != null && <Num>≈ {fmtEgp(data.wallets.liabilityEgp)}</Num>}{" "}
                    {t("finance.balances.holders", { count: data.wallets.holders })}
                  </>
                }
              />
            </div>

            <Card>
              <p className="fin-note" style={{ marginBlockEnd: 8 }}>{t("finance.balances.liability_note")}</p>
              <p className="fin-note">
                {t("finance.balances.fx", { rate: data.fx.rate ? fmtNum(data.fx.rate, 2) : "—" })}{" "}
                <Link to="/finance/supplier" className="fin-link">{t("finance.balances.open_supplier")}</Link>{" · "}
                <Link to="/finance/settings" className="fin-link">{t("finance.balances.open_settings")}</Link>
              </p>
            </Card>
          </>
        )}
      </StateBox>
    </div>
  );
}
