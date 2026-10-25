import { createContext, useContext, useEffect, useState } from "react";
import i18n from "./i18n.js";
import { LANGUAGE_CODES, isRTL } from "./languages.js";

const LanguageContext = createContext(null);

function pickInitial() {
  const stored = localStorage.getItem("app-lang");
  if (stored && LANGUAGE_CODES.includes(stored)) return stored;
  const detected = i18n.language?.split("-")[0];
  if (detected && LANGUAGE_CODES.includes(detected)) return detected;
  return "en";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(pickInitial);

  useEffect(() => {
    document.documentElement.dir = isRTL(language) ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("app-lang", language);
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language]);

  function setLanguage(next) {
    if (LANGUAGE_CODES.includes(next)) setLanguageState(next);
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage() must be used within a LanguageProvider");
  }
  return ctx;
}
