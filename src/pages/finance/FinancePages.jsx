import { useTranslation } from "react-i18next";
import { useAdminSession } from "../../components/admin/AdminSessionContext.jsx";
import { FinanceDashboard } from "../../components/admin/finance/FinanceDashboard.jsx";
import { ExpensesTab } from "../../components/admin/finance/ExpensesTab.jsx";
import { PnLTab } from "../../components/admin/finance/PnLTab.jsx";
import { SupplierTab } from "../../components/admin/finance/SupplierTab.jsx";
import { FinanceSettingsAudit } from "../../components/admin/finance/FinanceSettingsAudit.jsx";
import { OrdersPanel } from "../admin/OrdersPanel.jsx";
import { CashflowTab } from "../../components/admin/finance/CashflowTab.jsx";
import { BalancesTab } from "../../components/admin/finance/BalancesTab.jsx";

export const FinanceDashboardPage = () => <FinanceDashboard />;
export const FinanceReportsPage = () => <PnLTab />;
export const FinanceSupplierPage = () => <SupplierTab />;

export function FinanceExpensesPage() {
  const { role } = useAdminSession();
  return <ExpensesTab role={role} />;
}

export function FinanceSettingsPage() {
  const { role } = useAdminSession();
  return <FinanceSettingsAudit role={role} />;
}

export function FinanceOrdersPage() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="admin-section-head">
        <h1>{t("finance.nav.orders", "Orders")}</h1>
        <p>{t("finance.orders_sub", "Read-only financial view of orders.")}</p>
      </div>
      <OrdersPanel showFinance />
    </div>
  );
}

export const FinanceCashflowPage = () => <CashflowTab />;
export const FinanceBalancesPage = () => <BalancesTab />;
