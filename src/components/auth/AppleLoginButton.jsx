import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const MAX_ATTEMPTS = 75;

export function AppleLoginButton() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    function tryInit() {
      if (cancelled) return true;
      if (!window.AppleID?.auth) return false;

      const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
      if (!clientId) {
        console.error("[Apple] VITE_APPLE_CLIENT_ID is not set");
        return true;
      }

      window.AppleID.auth.init({
        clientId,
        scope: "name email",
        redirectURI: window.location.origin,
        state: "init",
        usePopup: true,
      });

      return true;
    }

    if (!tryInit()) {
      let attempts = 0;
      intervalId = setInterval(() => {
        attempts += 1;
        if (tryInit() || attempts >= MAX_ATTEMPTS) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  async function handleAppleLogin() {
    if (!window.AppleID?.auth) {
      console.error("[Apple] SDK is not loaded");
      return;
    }
    try {
      const data = await window.AppleID.auth.signIn();
      await authApi.appleLogin(data.authorization.id_token, data.user);
      await refresh();
      navigate("/");
    } catch (err) {
      console.error("Apple login failed:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleAppleLogin}
      className="social-btn social-btn-apple"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 384 512"
        fill="currentColor"
        style={{ marginRight: "8px" }}
        aria-hidden="true"
      >
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      {t("auth.continue_with_apple", "Continue with Apple")}
    </button>
  );
}
