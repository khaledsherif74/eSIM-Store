import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import ar from "./locales/ar.json";
import ru from "./locales/ru.json";
import tr from "./locales/tr.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import enExtra from "./locales/en.extra.json";
import arExtra from "./locales/ar.extra.json";

function deepMerge(base, extra) {
  const out = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === "object" &&
      !Array.isArray(out[key])
    ) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: deepMerge(en, enExtra) },
      ar: { translation: deepMerge(ar, arExtra) },
      ru: { translation: ru },
      tr: { translation: tr },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "ar", "ru", "tr", "es", "fr"],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "cookie", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "app-lang",
    },
  });

export default i18n;
