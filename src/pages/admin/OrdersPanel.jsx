import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { statusMeta, formatDate } from "../../utils/orderData.js";
import { adminApi } from "../../services/adminApi.js";
import { useTranslation } from "react-i18next";
import { STATUS_OPTIONS } from "./shared.jsx";
import { OrderDrawer } from "./operations/OrderDrawer.jsx";

export function OrdersPanel({ showFinance, canAct = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderStatus, setOrderStatus] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState("");
  const pageSize = 25;
  const showOrderFinance = Boolean(showFinance);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setLoadError("");
    try {
      const result = await adminApi.listOrders({ page: orderPage, pageSize, status: orderStatus });
      setOrders(result.orders);
      setTotalOrders(result.total);
    } catch (err) {
      setLoadError(err.message || "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }, [orderPage, orderStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const orderTotalPages = Math.max(1, Math.ceil(totalOrders / pageSize));

  return (
      <section className="admin-section">

        <div className="admin-orders-header">
          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value);
              setOrderPage(1);
            }}
          >
            <option value="">{t("admin.all_statuses")}</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loadingOrders ? (
          <Spinner label={t("admin.loading_orders")} />
        ) : (
          <>
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>{t("admin.col_order_id")}</th>
                  <th>{t("admin.col_product")}</th>
                  <th>{t("admin.col_customer")}</th>
                  <th>{t("admin.col_price")}</th>
                  {showOrderFinance && (
                    <>
                      <th>{t("admin.finance.col_cost")}</th>
                      <th>{t("admin.finance.col_fee")}</th>
                      <th>{t("admin.finance.col_profit")}</th>
                    </>
                  )}
                  <th>{t("admin.col_status")}</th>
                  <th>{t("admin.col_updated")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const [label, tone] = statusMeta(o.status);
                  return (
                    <tr
                      key={o.orderId}
                      className="ash-row-click"
                      tabIndex={0}
                      role="button"
                      onClick={() => setSelectedId(o.orderId)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedId(o.orderId)}
                    >
                      <td className="mono">{o.orderId}</td>
                      <td>{o.productTitle || o.productId}</td>
                      <td>{o.customer?.email || "—"}</td>
                      <td>
                        {o.price != null
                          ? `E£${Number(o.price).toFixed(2)}`
                          : "—"}
                      </td>
                      {showOrderFinance && (
                        <>
                          <td>
                            {o.sourcePrice != null
                              ? `$${Number(o.sourcePrice).toFixed(2)}`
                              : "—"}
                          </td>
                          <td>
                            {o.gatewayFee != null
                              ? `E£${Number(o.gatewayFee).toFixed(2)}`
                              : "—"}
                          </td>
                          <td>
                            {o.profit != null
                              ? `${o.estimated ? "~" : ""}E£${Number(o.profit).toFixed(2)}`
                              : "—"}
                          </td>
                        </>
                      )}
                      <td>
                        <Badge tone={tone}>{label}</Badge>
                      </td>
                      <td>{formatDate(o.updatedAt)}</td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={showOrderFinance ? 9 : 6}
                      className="admin-orders-empty"
                    >
                      {t("admin.no_orders")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="admin-pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={orderPage <= 1}
                onClick={() => setOrderPage((p) => p - 1)}
              >
                {t("admin.previous")}
              </Button>
              <span>
                {t("admin.page_of", {
                  page: orderPage,
                  total: orderTotalPages,
                })}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={orderPage >= orderTotalPages}
                onClick={() => setOrderPage((p) => p + 1)}
              >
                {t("admin.next")}
              </Button>
            </div>
          </>
        )}
        {selectedId && (
          <OrderDrawer
            orderId={selectedId}
            canAct={canAct}
            onClose={() => setSelectedId(null)}
            onChanged={loadOrders}
          />
        )}
      </section>
  );
}
