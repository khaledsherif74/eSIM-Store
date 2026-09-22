import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { adminApi } from "../services/adminApi.js";
import "./AdminLoginPage.css";

export function AdminLoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(username, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container admin-login-page">
      <Card className="admin-login-card">
        <div className="admin-login-icon">
          <Lock size={22} />
        </div>
        <h1>{t("admin_login.title")}</h1>
        <form onSubmit={onSubmit}>
          <label>
            {t("admin_login.username")}
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            {t("admin_login.password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="admin-login-error">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? t("admin_login.signing_in") : t("admin_login.sign_in")}
          </Button>
        </form>
        <div className="admin-login-footer">
          <Link to="/admin/forgot-password" className="admin-login-forgot-link">
            {t("admin_login.forgot_password", "Forgot Password?")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
