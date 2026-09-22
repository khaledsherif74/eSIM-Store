import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { adminApi } from "../services/adminApi.js";
import "./AdminLoginPage.css";

export function AdminForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await adminApi.forgotPassword(email);
      setMessage(res.message || t("admin_login.reset_sent", "If an account is associated with this email, a reset link has been sent."));
    } catch (err) {
      setError(err.message || t("admin_login.reset_error", "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container admin-login-page">
      <Card className="admin-login-card">
        <h1>{t("admin_login.forgot_password_title", "Reset Password")}</h1>
        <p className="admin-login-subtitle">{t("admin_login.forgot_password_desc", "Enter your admin email to receive a reset link.")}</p>
        <form onSubmit={onSubmit}>
          <label>
            {t("admin_login.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          {error && <p className="admin-login-error">{error}</p>}
          {message && <p className="admin-login-success">{message}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("admin_login.signing_in") : t("admin_login.send_reset_link", "Send Reset Link")}
          </Button>
        </form>
        <div className="admin-login-footer">
          <Button variant="secondary" onClick={() => navigate("/admin/login")} size="sm">
            {t("admin_login.back_to_login", "Back to Login")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
