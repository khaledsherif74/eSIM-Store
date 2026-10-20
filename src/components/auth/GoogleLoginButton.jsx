import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/authApi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function GoogleLoginButton() {
  const divRef = useRef(null);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

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
      if (!clientId) return true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        locale: currentLang,
      });

      divRef.current.innerHTML = ""; // Clear old button

      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: 380, // 380px is safe for all mobile screens
        text: "continue_with",
        shape: "pill", // "pill" makes it rounded. Use "rectangular" for square.
        logo_alignment: "center",
      });

      return true;
    }

    // 1. Remove any existing Google SDK script to force a fresh language load
    const existingScript = document.getElementById("google-jssdk");
    if (existingScript) {
      existingScript.remove();
    }

    // 2. Create a new script with the correct language parameter
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
          if (tryRender() || attempts >= 75) {
            clearInterval(intervalId);
          }
        }, 200);
      }
    };

    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [refresh, navigate, currentLang]);

  return (
    <div
      ref={divRef}
      className="social-google-slot"
      style={{ width: "100%", display: "flex", justifyContent: "center" }}
    />
  );
}
