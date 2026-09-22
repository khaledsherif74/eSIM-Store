import { createContext, useContext, useEffect, useState } from "react";
import i18n from "./i18n.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(
    localStorage.getItem("app-lang") || i18n.language?.split("-")[0] || "en",
  );

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("app-lang", language);
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language]);

  function setLanguage(next) {
    if (next === "en" || next === "ar") setLanguageState(next);
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
