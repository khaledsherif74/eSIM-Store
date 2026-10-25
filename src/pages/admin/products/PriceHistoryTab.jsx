import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { ProductPicker } from "../../../components/admin/EntityPickers.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Kpi,
  Num,
  StateBox,
  fmtEgp,
  fmtNum,
  fmtPct,
  fmtUsd,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";
import "../../../components/admin/finance/finance.css";

const MONTHS = [1, 3, 6, 12, 24];

function priceLabel(usd) {
  if (usd == null) return "—";
  return `$${Number(usd).toFixed(2)}`;
}

function ProductHeader({ product, t }) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <strong style={{ fontSize: 18 }}>{product.title}</strong>
          {product.providerName && (
            <p className="fin-note" style={{ marginTop: 4 }}>
              {product.providerName}
              {product.dataLimit != null && (
                <>
                  {" · "}
                  <Num>
                    {product.dataLimit}
                    {product.dataUnit || ""}
                  </Num>
                </>
              )}
              {product.validityDays != null && (
                <>
                  {" · "}
                  <Num>
                    {product.validityDays}
                    {t("admin.package_details.days", "d")}
                  </Num>
                </>
              )}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <span className="fin-sub">
              {t("admin.products.price_history_current_price")}
            </span>
            <strong style={{ fontSize: 22 }}>
              <Num>{fmtUsd(product.currentPrice)}</Num>
            </strong>
          </div>
          <div>
            <span className="fin-sub">
              {t("admin.products.price_history_cost")}
            </span>
            <strong style={{ fontSize: 22 }}>
              <Num>
                {product.sourcePrice == null
                  ? "—"
                  : fmtUsd(product.sourcePrice)}
              </Num>
            </strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Report({ data, t }) {
  const { product, buckets, totals, groupBy, months } = data;
  const revenue = (b) =>
    groupBy === "paid" ? b.paidRevenueEgp : b.catalogueRevenueEgp;
  const totalRevenue =
    groupBy === "paid" ? totals.paidRevenueEgp : totals.catalogueRevenueEgp;

  return (
    <>
      <ProductHeader product={product} t={t} />

      <div className="fin-grid">
        <Kpi
          label={t("admin.products.price_history_units")}
          value={fmtNum(totals.units, 0)}
          sub={t("admin.products.price_history_months_count", {
            count: months,
            defaultValue: "Last {{count}} month(s)",
          })}
        />
        <Kpi
          label={t("admin.products.price_history_revenue")}
          value={fmtEgp(totalRevenue)}
        />
        <Kpi
          label={t("admin.products.price_history_profit")}
          value={fmtEgp(totals.profitEgp)}
          tone={totals.profitEgp >= 0 ? "good" : "bad"}
        />
        <Kpi
          label={t("admin.products.price_history_margin")}
          value={fmtPct(totals.marginPct)}
          sub={t("admin.products.price_history_avg_profit", {
            amount: fmtEgp(totals.avgProfitPerUnit),
            defaultValue: "{{amount}} / unit",
          })}
        />
      </div>

      {buckets.length === 0 ? (
        <Card>
          <p className="fin-note">{t("admin.products.price_history_empty")}</p>
        </Card>
      ) : (
        <Card padded={false}>
          <div className="fin-table-wrap">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>{t("admin.products.price_history_price_usd")}</th>
                  <th className="num">
                    {t("admin.products.price_history_units")}
                  </th>
                  <th className="num">
                    {t("admin.products.price_history_revenue")}
                  </th>
                  {groupBy === "catalogue" && (
                    <th className="num">
                      {t("admin.products.price_history_discount")}
                    </th>
                  )}
                  <th className="num">
                    {t("admin.products.price_history_profit")}
                  </th>
                  <th className="num">
                    {t("admin.products.price_history_margin")}
                  </th>
                  <th>{t("admin.products.price_history_last_sale")}</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.usdPrice}>
                    <td>
                      <strong>
                        <Num>{priceLabel(b.usdPrice)}</Num>
                      </strong>
                    </td>
                    <td className="num">
                      <Num>{fmtNum(b.units, 0)}</Num>
                    </td>
                    <td className="num">
                      <Num>{fmtEgp(revenue(b))}</Num>
                    </td>
                    {groupBy === "catalogue" && (
                      <td className="num">
                        <Num>{fmtEgp(b.discountEgp)}</Num>
                      </td>
                    )}
                    <td className="num">
                      <Num>{fmtEgp(b.profitEgp)}</Num>
                    </td>
                    <td className="num">
                      <Num>{fmtPct(b.marginPct)}</Num>
                    </td>
                    <td>
                      <Num>
                        {b.lastOrderAt
                          ? new Date(b.lastOrderAt).toLocaleDateString()
                          : "—"}
                      </Num>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total">
                  <td>
                    <strong>{t("admin.finance.total")}</strong>
                  </td>
                  <td className="num">
                    <Num>{fmtNum(totals.units, 0)}</Num>
                  </td>
                  <td className="num">
                    <Num>{fmtEgp(totalRevenue)}</Num>
                  </td>
                  {groupBy === "catalogue" && (
                    <td className="num">
                      <Num>{fmtEgp(totals.discountEgp)}</Num>
                    </td>
                  )}
                  <td className="num">
                    <Num>{fmtEgp(totals.profitEgp)}</Num>
                  </td>
                  <td className="num">
                    <Num>{fmtPct(totals.marginPct)}</Num>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      <p className="fin-note">{t("admin.products.price_history_note")}</p>
    </>
  );
}

export function PriceHistoryTab() {
  const { t } = useTranslation();
  const [productId, setProductId] = useState("");
  const [months, setMonths] = useState(6);
  const [groupBy, setGroupBy] = useState("catalogue");

  const { data, loading, error, reload } = useAsync(
    () =>
      productId
        ? adminApi.getProductPriceHistory(productId, { months, groupBy })
        : Promise.resolve(null),
    [productId, months, groupBy],
  );

  return (
    <div className="fin-wrap">
      <Card>
        <h2 className="fin-card-title">
          {t("admin.products.price_history_title")}
        </h2>
        <p className="fin-note">{t("admin.products.price_history_sub")}</p>
        <div className="fin-form" style={{ marginTop: 12 }}>
          <div className="fin-field wide">
            <span>{t("admin.products.product")}</span>
            <ProductPicker value={productId} onChange={setProductId} />
          </div>
          <label className="fin-field">
            <span>{t("admin.products.price_history_months")}</span>
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <div className="fin-field">
            <span>{t("admin.products.price_history_group_by")}</span>
            <div className="fin-row-actions">
              <Button
                size="sm"
                variant={groupBy === "catalogue" ? "primary" : "secondary"}
                onClick={() => setGroupBy("catalogue")}
              >
                {t("admin.products.price_history_group_catalogue")}
              </Button>
              <Button
                size="sm"
                variant={groupBy === "paid" ? "primary" : "secondary"}
                onClick={() => setGroupBy("paid")}
              >
                {t("admin.products.price_history_group_paid")}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {!productId ? (
        <Card>
          <p className="fin-note">
            {t("admin.products.price_history_pick_product")}
          </p>
        </Card>
      ) : (
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && <Report data={data} t={t} />}
        </StateBox>
      )}
    </div>
  );
}
