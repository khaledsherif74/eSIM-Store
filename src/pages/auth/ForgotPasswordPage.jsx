import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { authApi } from "../../services/authApi.js";
import "./AuthPage.css";
import bgAuth from "../../public/images/bgAuth.jpg";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { t } = useTranslation();

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.forgotPassword(email);

      setSuccess(t("auth.forgot_password_success_message"));

      setEmail("");
    } catch (err) {
      setError(t("auth.forgot_password_error_message"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-container">
      <div
        className="auth-hero-section"
        style={{
          backgroundImage: `url(${bgAuth})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="auth-hero-content">
          <h1>{t("auth.forgot_password_hero_title")}</h1>
          <p>{t("auth.forgot_password_hero_subtitle")}</p>

          <div className="auth-hero-badges">
            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🔐</span>
              <span>{t("auth.forgot_password_hero_badge_secure")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">⚡</span>
              <span>{t("auth.forgot_password_hero_badge_recovery")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🛡️</span>
              <span>{t("auth.forgot_password_hero_badge_protected")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <Card className="auth-card">
          <div className="auth-card-header">
            <h1>{t("auth.forgot_password_title")}</h1>
            <p>{t("auth.forgot_password_subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">{t("auth.email_label")}</label>

              <div className="input-icon-wrap">
                <Mail size={16} className="input-icon" />

                <input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email_placeholder")}
                />
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            {success && <div className="auth-notice">{success}</div>}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <Spinner size={16} />
              ) : (
                t("auth.forgot_password_button")
              )}
            </Button>

            <p className="auth-footer">
              {t("auth.forgot_password_footer_title")}
              <Link className="auth-footer-link" to="/auth?tab=login">
                {t("auth.forgot_password_footer_subtitle")}
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
