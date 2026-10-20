import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReferralsTab } from "./referrals/ReferralsTab.jsx";
import { LedgerTab } from "./referrals/LedgerTab.jsx";
import { ReferralSettingsTab } from "./referrals/ReferralSettingsTab.jsx";

const TABS = [
  { id: "referrals", labelKey: "admin.referrals.tab_referrals" },
  { id: "ledger", labelKey: "admin.referrals.tab_ledger" },
  { id: "settings", labelKey: "admin.referrals.tab_settings" },
];

export function ReferralsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((x) => x.id === params.get("tab")) || TABS[0];
  return (
    <div>
      <div className="admin-section-head">
        <h1>{t("admin.nav.referrals")}</h1>
      </div>
      <div className="ash-tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={active.id === x.id} className={`ash-tab${active.id === x.id ? " active" : ""}`} onClick={() => setParams({ tab: x.id }, { replace: true })}>
            {t(x.labelKey)}
          </button>
        ))}
      </div>
      {active.id === "referrals" && <ReferralsTab />}
      {active.id === "ledger" && <LedgerTab />}
      {active.id === "settings" && <ReferralSettingsTab />}
    </div>
  );
}
