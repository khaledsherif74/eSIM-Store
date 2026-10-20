import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CouponsTab } from "./coupons/CouponsTab.jsx";
import { OffersTab } from "./coupons/OffersTab.jsx";

const TABS = [
  { id: "coupons", labelKey: "admin.coupons.tab_coupons" },
  { id: "offers", labelKey: "admin.coupons.tab_offers" },
];

export function CouponsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((x) => x.id === params.get("tab")) || TABS[0];
  return (
    <div>
      <div className="admin-section-head">
        <h1>{t("admin.nav.coupons")}</h1>
      </div>
      <div className="ash-tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={active.id === x.id} className={`ash-tab${active.id === x.id ? " active" : ""}`} onClick={() => setParams({ tab: x.id }, { replace: true })}>
            {t(x.labelKey)}
          </button>
        ))}
      </div>
      {active.id === "coupons" ? <CouponsTab /> : <OffersTab />}
    </div>
  );
}
