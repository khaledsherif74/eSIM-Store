import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PricingManagerTab } from "./products/PricingManagerTab.jsx";
import { CostChangesTab } from "./products/CostChangesTab.jsx";
import { SyncPanel } from "./products/SyncPanel.jsx";
import "../../components/admin/finance/finance.css";

const TABS = [
  {
    id: "catalogue",
    labelKey: "admin.products.tab_pricing_management",
    fallback: "Product Pricing",
  },
  {
    id: "changes",
    labelKey: "admin.products.tab_changes",
    fallback: "Supplier Cost Changes",
  },
  {
    id: "sync",
    labelKey: "admin.products.tab_sync",
    fallback: "Supplier Sync",
  },
];

export function ProductsPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const active = TABS.find((tab) => tab.id === params.get("tab")) || TABS[0];
  return (
    <div>
      <div className="admin-section-head">
        <h1>{t("admin.nav.products")}</h1>
      </div>
      <div className="ash-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active.id === tab.id}
            className={`ash-tab${active.id === tab.id ? " active" : ""}`}
            onClick={() => setParams({ tab: tab.id }, { replace: true })}
          >
            {t(tab.labelKey, tab.fallback)}
          </button>
        ))}
      </div>
      {active.id === "catalogue" && <PricingManagerTab />}
      {active.id === "changes" && <CostChangesTab />}
      {active.id === "sync" && <SyncPanel />}
    </div>
  );
}
