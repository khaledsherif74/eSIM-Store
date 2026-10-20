import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Empty,
  Num,
  StateBox,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";

export function LogsTab() {
  const { t } = useTranslation();
  const [entity, setEntity] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [applied, setApplied] = useState({ actor: "", action: "" });
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () =>
      adminApi.listAuditLog({
        entity,
        actor: applied.actor,
        action: applied.action,
        page,
      }),
    [entity, applied, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const apply = () => {
    setApplied({ actor: actor.trim(), action: action.trim() });
    setPage(1);
  };
  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.ops.entity")}</span>
          <select
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("admin.finance.all")}</option>
            {(data?.entities || []).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.by")}</span>
          <input
            value={actor}
            maxLength={100}
            onChange={(e) => setActor(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.action")}</span>
          <input
            value={action}
            maxLength={100}
            placeholder="coupon."
            onChange={(e) => setAction(e.target.value)}
            onBlur={apply}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </label>
      </div>
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.finance.no_audit")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.time")}</th>
                        <th>{t("admin.finance.by")}</th>
                        <th>{t("admin.finance.action")}</th>
                        <th>{t("admin.ops.entity")}</th>
                        <th>{t("admin.finance.details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <Num>{new Date(a.createdAt).toLocaleString()}</Num>
                          </td>
                          <td>
                            {a.actor}
                            <span className="fin-sub">{a.role}</span>
                          </td>
                          <td className="mono">{a.action}</td>
                          <td>
                            {a.entity}
                            {a.entityId && (
                              <span className="fin-sub mono">{a.entityId}</span>
                            )}
                          </td>
                          <td
                            className="mono"
                            style={{ overflowWrap: "anywhere" }}
                          >
                            {a.details ? JSON.stringify(a.details) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((x) => x - 1)}
                  >
                    {t("admin.previous")}
                  </Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setPage((x) => x + 1)}
                  >
                    {t("admin.next")}
                  </Button>
                </div>
              </>
            )
          )}
        </StateBox>
      </Card>
    </div>
  );
}
