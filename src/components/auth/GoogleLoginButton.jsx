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
      <div className="google-btn-wrap">
        <div ref={slotRef} className="google-btn-slot" aria-label="Google" />
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
