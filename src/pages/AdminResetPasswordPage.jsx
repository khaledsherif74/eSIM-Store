import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { adminApi } from "../services/adminApi.js";
import "./AdminLoginPage.css";

export function AdminResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError(t("admin_login.invalid_token", "Invalid or missing reset token."));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("admin_login.passwords_dont_match", "Passwords do not match."));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("admin_login.password_too_short", "Password must be at least 8 characters."));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await adminApi.resetPassword(token, newPassword);
      navigate("/admin/login", { replace: true });
    } catch (err) {
      setError(err.message || t("admin_login.reset_failed", "Password reset failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container admin-login-page">
      <Card className="admin-login-card">
        <h1>{t("admin_login.set_new_password", "Set New Password")}</h1>
        <p className="admin-login-subtitle">{t("admin_login.reset_desc", "Please enter your new password below.")}</p>
        <form onSubmit={onSubmit}>
          <label>
            {t("admin_login.new_password")}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            {t("admin_login.confirm_password")}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error && <p className="admin-login-error">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("admin_login.signing_in") : t("admin_login.update_password", "Update Password")}
          </Button>
        </form>
      </Card>
    </div>
  );
}
