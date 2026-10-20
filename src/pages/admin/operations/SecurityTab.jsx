import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Kpi, Num, StateBox, errorText, fmtNum, useAsync } from "../../../components/admin/finance/financeUtils.jsx";

const fmtWindow = (s) => (s % 60 === 0 ? `${s / 60} min` : `${s}s`);

export function SecurityTab() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(() => adminApi.getSecurity(), []);
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState("");

  async function revoke(s) {
    if (!window.confirm(t("admin.ops.revoke_confirm", { name: s.username }))) return;
    setBusy(s.id);
    setErr("");
    try {
      await adminApi.revokeAdminSession(s.id);
      reload();
    } catch (e) {
      setErr(errorText(e, t));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fin-wrap">
      <StateBox loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            {err && <div className="fin-alert danger" role="alert">{err}</div>}
            <div className="fin-grid">
              <Kpi label={t("admin.ops.failed_24h")} value={fmtNum(data.stats.failedLast24h, 0)} tone={data.stats.failedLast24h >= 10 ? "bad" : undefined} />
              <Kpi label={t("admin.ops.success_24h")} value={fmtNum(data.stats.successLast24h, 0)} />
              <Kpi label={t("admin.ops.active_sessions")} value={fmtNum(data.sessions.length, 0)} />
            </div>

            <Card padded={false}>
              <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>{t("admin.ops.sessions_title")}</h2>
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.users.user")}</th>
                      <th>{t("admin.finance.role")}</th>
                      <th>{t("admin.ops.expires")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map((s) => (
                      <tr key={s.id}>
                        <td><Num>{s.username}</Num>{s.current && <Badge tone="primary">{t("admin.finance.team_you")}</Badge>}</td>
                        <td>{t(`admin.finance.role_${s.role}`, s.role)}</td>
                        <td><Num>{new Date(s.expire).toLocaleString()}</Num></td>
                        <td>
                          {!s.current && <Button size="sm" variant="danger" disabled={busy === s.id} onClick={() => revoke(s)}>{t("admin.ops.revoke")}</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card padded={false}>
              <h2 className="fin-card-title" style={{ padding: "16px 16px 0" }}>{t("admin.ops.attempts_title")}</h2>
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.finance.time")}</th>
                      <th>{t("admin.users.user")}</th>
                      <th>{t("admin.ops.network")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attempts.map((a) => (
                      <tr key={a.id}>
                        <td><Num>{new Date(a.at).toLocaleString()}</Num></td>
                        <td dir="ltr">{a.username}</td>
                        <td><Num>{a.ip || "—"}</Num></td>
                        <td>
                          <Badge tone={a.success ? "success" : "danger"}>{a.success ? t("admin.ops.login_ok") : t("admin.ops.login_failed")}</Badge>
                          {a.reason && <span className="fin-sub">{a.reason}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <h2 className="fin-card-title">{t("admin.ops.limits_title")}</h2>
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <tbody>
                    {data.rateLimits.map((r) => (
                      <tr key={r.key}>
                        <td>{t(`admin.ops.limit_${r.key}`)}</td>
                        <td><Num>{r.limit} / {fmtWindow(r.windowSeconds)}</Num></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="fin-note" style={{ marginBlockStart: 8 }}>{t("admin.ops.limits_note")}</p>
              <p className="fin-note">{t("admin.ops.no_2fa_note")}</p>
            </Card>
          </>
        )}
      </StateBox>
    </div>
  );
}
