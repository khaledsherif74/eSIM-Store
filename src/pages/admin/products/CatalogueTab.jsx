import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, errorText, fmtEgp, fmtNum, fmtPct, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const FLAGS = ["hidden", "featured", "bestSeller"];

export function CatalogueTab() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [hidden, setHidden] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  const { data, loading, error, reload } = useAsync(
    () => adminApi.listProducts({ q: search, country, hidden, page }),
    [search, country, hidden, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function toggle(p, flag) {
    setBusy(`${p.productId}:${flag}`);
    setErr("");
    try {
      await adminApi.updateProduct(p.productId, { [flag]: !p[flag] });
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(null);
    }
  }
  const commitSearch = () => {
    if (q.trim() !== search) {
      setSearch(q.trim());
      setPage(1);
    }
  };

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.products.country_code")}</span>
          <input
            dir="ltr"
            value={country}
            maxLength={2}
            placeholder="TR"
            onChange={(e) => {
              setCountry(e.target.value.toUpperCase());
              setPage(1);
            }}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.products.visibility")}</span>
          <select
            value={hidden}
            onChange={(e) => {
              setHidden(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("admin.finance.all")}</option>
            <option value="false">{t("admin.products.visible")}</option>
            <option value="true">{t("admin.products.hidden")}</option>
          </select>
        </label>
      </div>
      {err && <div className="fin-alert danger" role="alert">{err}</div>}
      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.products.none")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.products.product")}</th>
                        <th className="num">{t("admin.products.cost")}</th>
                        <th className="num">{t("admin.products.price")}</th>
                        <th className="num">{t("admin.products.margin")}</th>
                        <th>{t("admin.products.rule")}</th>
                        <th>{t("admin.products.flags")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((p) => (
                        <tr key={p.productId} style={p.active ? undefined : { opacity: 0.55 }}>
                          <td>
                            {p.title}
                            <span className="fin-sub">
                              {p.providerName}
                              {p.dataLimit ? ` · ${fmtNum(p.dataLimit, p.dataLimit % 1 ? 1 : 0)}${p.dataUnit || ""}` : ""}
                              {p.validityDays ? ` · ${p.validityDays}d` : ""}
                            </span>
                            {!p.active && <Badge tone="neutral">{t("admin.products.inactive")}</Badge>}
                          </td>
                          <td className="num"><Num>{p.sourcePrice == null ? "—" : fmtUsd(p.sourcePrice)}</Num></td>
                          <td className="num">
                            <Num>{fmtUsd(p.price)}</Num>
                            {p.stale && <span className="fin-sub">{t("admin.products.stale")}</span>}
                          </td>
                          <td className="num">
                            {p.marginEgp == null ? "—" : (
                              <>
                                <Num>{fmtEgp(p.marginEgp)}</Num>
                                <span className="fin-sub"><Num>{fmtPct(p.marginPct)}</Num></span>
                              </>
                            )}
                            {p.belowCost && <Badge tone="danger">{t("admin.products.below_cost")}</Badge>}
                          </td>
                          <td>{p.ruleScope ? t(`admin.products.scope_${p.ruleScope}`) : "—"}</td>
                          <td>
                            <div className="fin-row-actions">
                              {FLAGS.map((f) => (
                                <Button
                                  key={f}
                                  size="sm"
                                  variant={p[f] ? "primary" : "secondary"}
                                  aria-pressed={p[f]}
                                  disabled={busy === `${p.productId}:${f}`}
                                  onClick={() => toggle(p, f)}
                                >
                                  {t(`admin.products.flag_${f}`)}
                                </Button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
                    {t("admin.previous")}
                  </Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((x) => x + 1)}>
                    {t("admin.next")}
                  </Button>
                </div>
              </>
            )
          )}
        </StateBox>
      </Card>
      <p className="fin-note">{t("admin.products.margin_note")}</p>
    </div>
  );
}
