import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../ui/Card.jsx";
import { Button } from "../../ui/Button.jsx";
import { Badge } from "../../ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Empty,
  Num,
  ROLES,
  StateBox,
  errorText,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

const BLANK = { username: "", password: "", role: "Accountant", email: "" };

export function TeamTab({ currentUsername }) {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listAdminUsers(),
    [],
  );
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [rowError, setRowError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function create() {
    setSaving(true);
    setFormError("");
    try {
      await adminApi.createAdminUser({
        username: form.username,
        password: form.password,
        role: form.role,
        ...(form.email ? { email: form.email } : {}),
      });
      setForm(BLANK);
      reload();
    } catch (err) {
      setFormError(errorText(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function patch(user, body, confirmKey) {
    if (confirmKey && !window.confirm(t(confirmKey, { name: user.username })))
      return;
    setBusyId(user.id);
    setRowError("");
    try {
      await adminApi.updateAdminUser(user.id, body);
      reload();
    } catch (err) {
      setRowError(errorText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  function resetPassword(user) {
    const pw = window.prompt(
      t("admin.finance.team_new_password", { name: user.username }),
    );
    if (pw) patch(user, { password: pw });
  }

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.team_title")}</h1>
        <p>{t("admin.finance.team_sub")}</p>
      </div>

      <Card>
        <h2 className="fin-card-title">{t("admin.finance.team_add")}</h2>
        <div className="fin-form">
          <label className="fin-field">
            <span>{t("admin.finance.team_username")}</span>
            <input
              dir="ltr"
              autoComplete="off"
              value={form.username}
              onChange={set("username")}
              maxLength={40}
            />
          </label>
          <label className="fin-field">
            <span>{t("admin.finance.team_password")}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
            />
          </label>
          <label className="fin-field">
            <span>{t("admin.finance.role")}</span>
            <select value={form.role} onChange={set("role")}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`admin.finance.role_${r}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="fin-field">
            <span>{t("admin.finance.team_email")}</span>
            <input
              type="email"
              dir="ltr"
              value={form.email}
              onChange={set("email")}
            />
          </label>
          <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
            {t("admin.finance.team_password_hint")}
          </p>
          {formError && (
            <p className="fin-form-error" role="alert">
              {formError}
            </p>
          )}
          <div className="fin-form-actions">
            <Button onClick={create} disabled={saving}>
              {t("admin.finance.team_create")}
            </Button>
          </div>
        </div>
      </Card>

      {rowError && (
        <div className="fin-alert danger" role="alert">
          {rowError}
        </div>
      )}

      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.finance.team_empty")}</Empty>
          ) : (
            data && (
              <div className="fin-table-wrap">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>{t("admin.finance.team_username")}</th>
                      <th>{t("admin.finance.role")}</th>
                      <th>{t("admin.finance.team_email")}</th>
                      <th>{t("admin.finance.f_status")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <Num>{u.username}</Num>
                          {u.username === currentUsername && (
                            <span className="fin-sub">
                              {t("admin.finance.team_you")}
                            </span>
                          )}
                        </td>
                        <td>
                          <select
                            aria-label={t("admin.finance.role")}
                            value={u.role}
                            disabled={busyId === u.id}
                            onChange={(e) => patch(u, { role: e.target.value })}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {t(`admin.finance.role_${r}`)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td dir="ltr">{u.email || "—"}</td>
                        <td>
                          <Badge tone={u.active ? "success" : "neutral"}>
                            {u.active
                              ? t("admin.finance.team_active")
                              : t("admin.finance.team_inactive")}
                          </Badge>
                        </td>
                        <td>
                          <div className="fin-row-actions">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyId === u.id}
                              onClick={() => resetPassword(u)}
                            >
                              {t("admin.finance.team_reset_password")}
                            </Button>
                            {u.active ? (
                              <Button
                                variant="danger"
                                size="sm"
                                disabled={busyId === u.id}
                                onClick={() =>
                                  patch(
                                    u,
                                    { active: false },
                                    "admin.finance.team_deactivate_confirm",
                                  )
                                }
                              >
                                {t("admin.finance.team_deactivate")}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={busyId === u.id}
                                onClick={() => patch(u, { active: true })}
                              >
                                {t("admin.finance.team_activate")}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </StateBox>
      </Card>
    </div>
  );
}
