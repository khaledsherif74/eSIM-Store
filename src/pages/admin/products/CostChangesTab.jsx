import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Delta, Empty, Num, StateBox, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

export function CostChangesTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => adminApi.listCostChanges({ page }), [page]);
  return (
    <Card padded={false}>
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <Empty>{t("admin.products.no_changes")}</Empty>
        ) : (
          data && (
            <>
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.products.product")}</th>
                      <th className="num">{t("admin.products.old_cost")}</th>
                      <th className="num">{t("admin.products.new_cost")}</th>
                      <th className="num">%</th>
                      <th>{t("admin.finance.time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((c, i) => (
                      <tr key={`${c.productId}-${c.at}-${i}`}>
                        <td>{c.title}</td>
                        <td className="num"><Num>{fmtUsd(c.oldCost)}</Num></td>
                        <td className="num"><Num>{fmtUsd(c.newCost)}</Num></td>
                        <td className="num"><Delta value={c.changePct} /></td>
                        <td><Num>{new Date(c.at).toLocaleString()}</Num></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>{t("admin.previous")}</Button>
                <span>{t("admin.page_of", { page, total: data.items.length < data.pageSize ? page : page + 1 })}</span>
                <Button variant="secondary" size="sm" disabled={data.items.length < data.pageSize} onClick={() => setPage((x) => x + 1)}>{t("admin.next")}</Button>
              </div>
            </>
          )
        )}
      </StateBox>
    </Card>
  );
}
