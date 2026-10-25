import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./GoogleLoginButton.css";

const MAX_ATTEMPTS = 75;

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleLoginButton() {
  const divRef = useRef(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [sdkFailed, setSdkFailed] = useState(false);

  const currentLang = i18n.language?.startsWith("ar") ? "ar" : "en";

  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    async function handleCredentialResponse(response) {
      try {
        await authApi.googleLogin(response.credential);
        await refresh();
        navigate("/");
      } catch (err) {
        console.error("Google login failed:", err);
      }
    }

    function tryRender() {
      if (cancelled) return true;
      if (!divRef.current) return false;
      if (!window.google?.accounts?.id) return false;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn(
          "[Google] VITE_GOOGLE_CLIENT_ID is not set. The Google Login button will not work.",
        );
        return true;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          locale: currentLang,
        });

        divRef.current.innerHTML = "";

        window.google.accounts.id.renderButton(divRef.current, {
          type: "icon",
          shape: "circle",
          theme: "outline",
          size: "large",
        });
      } catch (err) {
        console.error("[Google] Render error:", err);
        setSdkFailed(true);
      }

      return true;
    }

    const existingScript = document.getElementById("google-jssdk");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "google-jssdk";
    script.src = `https://accounts.google.com/gsi/client?hl=${currentLang}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!tryRender()) {
        let attempts = 0;
        intervalId = setInterval(() => {
          attempts += 1;
          if (tryRender()) {
            clearInterval(intervalId);
            intervalId = null;
          } else if (attempts >= MAX_ATTEMPTS) {
            clearInterval(intervalId);
            intervalId = null;
            if (!cancelled) setSdkFailed(true);
          }
        }, 200);
      }
    };

    script.onerror = () => {
      if (!cancelled) setSdkFailed(true);
    };

    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [refresh, navigate, currentLang]);

  return (
    <>
      <div className="social-google-wrap">
        <span className="social-google-visual">
          <GoogleG />
        </span>
        <div ref={divRef} className="social-google-slot" aria-label="Google" />
      </div>
      {sdkFailed && (
        <p className="social-fallback-hint" role="alert">
          {t("auth.google_sdk_blocked")}
        </p>
      )}
    </>
  );
}
