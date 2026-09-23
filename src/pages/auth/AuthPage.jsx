import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Gift, Eye, EyeOff } from "lucide-react";

import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { authApi } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.jsx";

import "./AuthPage.css";
import bgAuth from "../../public/images/bgAuth.jpg";

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const { t } = useTranslation();

  const refFromLink = params.get("ref") || "";

  const [tab, setTab] = useState(
    refFromLink || params.get("tab") !== "login" ? "signup" : "login",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [referralNotice, setReferralNotice] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    referralCode: refFromLink,
  });

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setReferralNotice(null);

    try {
      await authApi.login(loginData);
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setReferralNotice(null);

    try {
      const result = await authApi.signup(signupData);

      await refresh();

      if (signupData.referralCode) {
        setReferralNotice(
          result.referralApplied
            ? "Referral code applied — thanks for joining through a friend!"
            : "That referral code wasn't recognized, but your account was still created.",
        );

        setTimeout(() => navigate("/"), 1800);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  }

  function switchTab(next) {
    setTab(next);
    setError(null);
    setReferralNotice(null);
  }

  return (
    <div className="auth-page-container">
      <div
        style={{
          backgroundImage: `url(${bgAuth})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="auth-hero-section"
      >
        <div className="auth-hero-content">
          <h1>
            {t("auth.hero_title_1")} {t("auth.hero_title_2")}
          </h1>

          <p>{t("auth.hero_subtitle")}</p>

          <div className="auth-hero-badges">
            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🌍</span>

              <span>{t("auth.hero_badge_countries")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">⚡</span>

              <span>{t("auth.hero_badge_instant")}</span>
            </div>

            <div className="auth-hero-badge">
              <span className="auth-hero-badge-icon">🛡️</span>

              <span>{t("auth.hero_badge_secure")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-section">
        <Card className="auth-card">
          <div className="auth-tabs" role="tablist">
            <span
              className={`auth-tabs-thumb${tab === "signup" ? " right" : ""}`}
              aria-hidden="true"
            />

            <button
              type="button"
              role="tab"
              aria-selected={tab === "login"}
              className={`auth-tab${tab === "login" ? " active" : ""}`}
              onClick={() => switchTab("login")}
            >
              {t("auth.login_tab")}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === "signup"}
              className={`auth-tab${tab === "signup" ? " active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              {t("auth.signup_tab")}
            </button>
          </div>

          {tab === "login" ? (
            <>
              <div className="auth-card-header">
                <h1>{t("auth.welcome_back")}</h1>

                <p>{t("auth.login_subtitle")}</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>{t("auth.email_label")}</label>

                  <div className="input-icon-wrap">
                    <Mail size={16} className="input-icon" />

                    <input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          email: e.target.value,
                        })
                      }
                      placeholder={t("auth.email_placeholder")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("auth.password_label")}</label>

                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                      placeholder={t("auth.password_placeholder")}
                    />

                    <button
                      type="button"
                      className="input-icon-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={t("auth.password_toggle_aria")}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-forgot-password">
                  <Link to="/auth/forgot-password">
                    {t("auth.forgot_password_title")}
                  </Link>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size={16} /> : t("auth.login_button")}
                </Button>

                <p className="auth-footer">
                  {t("auth.no_account")}{" "}
                  <button
                    type="button"
                    className="auth-footer-link"
                    onClick={() => switchTab("signup")}
                  >
                    {t("auth.signup_link")}
                  </button>
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="auth-card-header">
                <h1>{t("auth.create_account")}</h1>

                <p>{t("auth.signup_subtitle")}</p>
              </div>

              <form onSubmit={handleSignup} className="auth-form">
                <div className="form-group">
                  <label>{t("auth.full_name_label")}</label>

                  <div className="input-icon-wrap">
                    <User size={16} className="input-icon" />

                    <input
                      type="text"
                      required
                      value={signupData.name}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          name: e.target.value,
                        })
                      }
                      placeholder={t("auth.name_placeholder")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("auth.email_label")}</label>

                  <div className="input-icon-wrap">
                    <Mail size={16} className="input-icon" />

                    <input
                      type="email"
                      required
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          email: e.target.value,
                        })
                      }
                      placeholder={t("auth.email_placeholder")}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("auth.password_label")}</label>

                  <div className="input-icon-wrap">
                    <Lock size={16} className="input-icon" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          password: e.target.value,
                        })
                      }
                      placeholder={t("auth.password_placeholder")}
                    />

                    <button
                      type="button"
                      className="input-icon-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={t("auth.password_toggle_aria")}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("auth.referral_label")}</label>

                  <div className="input-icon-wrap">
                    <Gift size={16} className="input-icon" />

                    <input
                      type="text"
                      value={signupData.referralCode}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          referralCode: e.target.value,
                        })
                      }
                      placeholder={t("auth.referral_placeholder")}
                      readOnly={!!refFromLink}
                    />
                  </div>

                  {refFromLink && (
                    <span className="auth-hint">{t("auth.referral_hint")}</span>
                  )}
                </div>

                {referralNotice && (
                  <div className="auth-notice">{referralNotice}</div>
                )}

                {error && <div className="auth-error">{error}</div>}

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? <Spinner size={16} /> : t("auth.signup_button")}
                </Button>

                <p className="auth-footer">
                  {t("auth.have_account")}{" "}
                  <button
                    type="button"
                    className="auth-footer-link"
                    onClick={() => switchTab("login")}
                  >
                    {t("auth.login_link")}
                  </button>
                </p>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
