import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { authApi } from "../../services/authApi.js";
import "./AuthPage.css";
import bgAuth from "../../public/images/bgAuth.jpg";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { t } = useTranslation();

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);

    if (!token) {
      setError(t("auth.reset_password_token_message"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.reset_password_password_min_length_message"));
      return;
    }

    if (password.length > 72) {
      setError(t("auth.reset_password_password_max_length_message"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.reset_password_confirm_error_message"));
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);

      navigate("/auth?tab=login", {
        replace: true,
        state: {
          resetSuccess: true,
        },
      });
    } catch (err) {
      setError(err.message || t("auth.reset_password_error_message"));
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
          <h1>{t("auth.reset_password_hero_title")}</h1>
          <p>{t("auth.reset_password_hero_subtitle")}</p>

          <div className="auth-hero-badges">
            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🔐</span>
              <span>{t("auth.reset_password_hero_badge_secure")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🛡️</span>
              <span>{t("auth.reset_password_hero_badge_protected")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">✓</span>
              <span>{t("auth.reset_password_hero_one_time")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <Card className="auth-card">
          <div className="auth-card-header">
            <h1>{t("auth.reset_password_title")}</h1>
            <p>{t("auth.reset_password_subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reset-password">
                {t("auth.new_password_label")}
              </label>

              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />

                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                />

                <button
                  type="button"
                  className="input-icon-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reset-confirm-password">
                {t("auth.password_confirm_label")}
              </label>

              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />

                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                />

                <button
                  type="button"
                  className="input-icon-toggle"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? (
                <Spinner size={16} />
              ) : (
                t("auth.reset_password_button")
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
