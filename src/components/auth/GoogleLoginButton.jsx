import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./GoogleLoginButton.css";

const SDK_SRC = "https://accounts.google.com/gsi/client";
const POLL_MS = 100;
const MAX_WAIT_MS = 10000;

let sdkPromise = null;

function loadGoogleSdk() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`script[src^="${SDK_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - startedAt > MAX_WAIT_MS) {
        clearInterval(timer);
        sdkPromise = null;
        reject(new Error("Google SDK did not load"));
      }
    }, POLL_MS);
  });

  return sdkPromise;
}

export function GoogleLoginButton() {
  const slotRef = useRef(null);
  const handlerRef = useRef(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [sdkFailed, setSdkFailed] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const currentLang = i18n.language?.startsWith("ar") ? "ar" : "en";

  handlerRef.current = async (response) => {
    setLoginError(null);
    try {
      await authApi.googleLogin(response.credential);
      await refresh();
      navigate("/");
    } catch (err) {
      console.error("Google login failed:", err);
      setLoginError(
        err?.message ||
          t(
            "auth.google_login_failed",
            "Google sign-in failed. Please try again.",
          ),
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("[Google] VITE_GOOGLE_CLIENT_ID is not set.");
      setSdkFailed(true);
      return undefined;
    }

    loadGoogleSdk()
      .then(() => {
        if (cancelled || !slotRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handlerRef.current?.(response),
        });
        slotRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(slotRef.current, {
          type: "icon",
          shape: "circle",
          theme: "outline",
          size: "large",
          locale: currentLang,
        });
        setSdkFailed(false);
      })
      .catch((err) => {
        console.error("[Google] SDK error:", err);
        if (!cancelled) setSdkFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [currentLang]);

  return (
    <div className="google-btn-root">
      <div
        className="social-google-button"
        aria-label={t("auth.continue_with_google", "Continue with Google")}
        title={t("auth.continue_with_google", "Continue with Google")}
      >
        <svg
          className="social-google-logo"
          viewBox="0 0 48 48"
          width="20"
          height="20"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="google-logo-red"
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            className="google-logo-blue"
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.64 5.94c4.46-4.12 7.12-10.2 7.12-17.59z"
          />
          <path
            className="google-logo-yellow"
            fill="#FBBC05"
            d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
          />
          <path
            className="google-logo-green"
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.81l-7.64-5.94c-2.12 1.42-4.83 2.26-8.27 2.26-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
        <div
          ref={slotRef}
          className="social-google-slot"
          aria-label={t("auth.continue_with_google", "Continue with Google")}
        />
      </div>
      {sdkFailed && (
        <p className="social-fallback-hint google-btn-hint" role="alert">
          {t("auth.google_sdk_blocked")}
        </p>
      )}
      {loginError && (
        <p className="social-fallback-hint google-btn-hint" role="alert">
          {loginError}
        </p>
      )}
    </div>
  );
}
