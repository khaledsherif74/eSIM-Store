import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CatalogueTab } from "./products/CatalogueTab.jsx";
import { RulesTab } from "./products/RulesTab.jsx";
import { PricingSettingsTab } from "./products/PricingSettingsTab.jsx";
import { CostChangesTab } from "./products/CostChangesTab.jsx";
import { PriceHistoryTab } from "./products/PriceHistoryTab.jsx";
import { SyncPanel } from "./products/SyncPanel.jsx";
import "../../components/admin/finance/finance.css";

const TABS = [
  { id: "catalogue", labelKey: "admin.products.tab_catalogue" },
  { id: "rules", labelKey: "admin.products.tab_rules" },
  { id: "settings", labelKey: "admin.products.tab_settings" },
  { id: "changes", labelKey: "admin.products.tab_changes" },
  { id: "price-history", labelKey: "admin.products.tab_price_history" },
  { id: "sync", labelKey: "admin.products.tab_sync" },
];

export function ProductsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((x) => x.id === params.get("tab")) || TABS[0];
  return (
    <div>
      <div className="admin-section-head">
        <h1>{t("admin.nav.products")}</h1>
      </div>
      <div className="ash-tabs" role="tablist">
        {TABS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            aria-selected={active.id === x.id}
            className={`ash-tab${active.id === x.id ? " active" : ""}`}
            onClick={() => setParams({ tab: x.id }, { replace: true })}
          >
            {t(x.labelKey)}
          </button>
        ))}
      </div>
      {active.id === "catalogue" && <CatalogueTab />}
      {active.id === "rules" && <RulesTab />}
      {active.id === "settings" && <PricingSettingsTab />}
      {active.id === "changes" && <CostChangesTab />}
      {active.id === "price-history" && <PriceHistoryTab />}
      {active.id === "sync" && <SyncPanel />}
    </div>
  );
}
