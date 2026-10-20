import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminSession } from "../../components/admin/AdminSessionContext.jsx";
import { TeamTab } from "../../components/admin/finance/TeamTab.jsx";
import { OrdersPanel } from "./OrdersPanel.jsx";
import { SettingsTab } from "./SettingsTab.jsx";
import { SecretsTab } from "./SecretsTab.jsx";
import { PaymentsTab } from "./operations/PaymentsTab.jsx";
import { EmailsTab } from "./operations/EmailsTab.jsx";
import { SecurityTab } from "./operations/SecurityTab.jsx";
import { SiteSettingsCard } from "./operations/SiteSettingsCard.jsx";
import { ReportsTab } from "./operations/ReportsTab.jsx";
import { LogsTab } from "./operations/LogsTab.jsx";

const TABS = [
  { id: "orders", labelKey: "admin.ops.orders", roles: ["Admin", "Support"] },
  { id: "payments", labelKey: "admin.ops.payments", roles: ["Admin"] },
  { id: "emails", labelKey: "admin.ops.emails", roles: ["Admin"] },
  { id: "team", labelKey: "admin.ops.team", roles: ["Admin"] },
  { id: "security", labelKey: "admin.ops.security", roles: ["Admin"] },
  { id: "settings", labelKey: "admin.ops.settings", roles: ["Admin"] },
  { id: "secrets", labelKey: "admin.ops.secrets", roles: ["Admin"] },
  { id: "reports", labelKey: "admin.ops.reports", roles: ["Admin"] },
  { id: "logs", labelKey: "admin.ops.logs", roles: ["Admin"] },
];

export function OperationsPage() {
  const { t } = useTranslation();
  const session = useAdminSession();
  const [params, setParams] = useSearchParams();
  const tabs = useMemo(
    () => TABS.filter((x) => x.roles.includes(session.role)),
    [session.role],
  );
  const active = tabs.find((x) => x.id === params.get("tab")) || tabs[0];
  const isAdmin = session.role === "Admin";

  return (
    <div className="ash-ops">
      <div className="admin-section-head">
        <h1>{t("admin.nav.operations")}</h1>
      </div>
      {tabs.length > 1 && (
        <div className="ash-tabs" role="tablist">
          {tabs.map((x) => (
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
      )}
      {active.id === "orders" && (
        <OrdersPanel showFinance={isAdmin} canAct={isAdmin} />
      )}
      {active.id === "payments" && <PaymentsTab />}
      {active.id === "emails" && <EmailsTab />}
      {active.id === "team" && <TeamTab currentUsername={session.username} />}
      {active.id === "security" && <SecurityTab />}
      {active.id === "settings" && (
        <div className="fin-wrap">
          <SiteSettingsCard />
          <SettingsTab />
        </div>
      )}
      {active.id === "secrets" && <SecretsTab />}
      {active.id === "reports" && <ReportsTab />}
      {active.id === "logs" && <LogsTab />}
    </div>
  );
}
