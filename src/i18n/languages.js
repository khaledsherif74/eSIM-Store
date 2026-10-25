export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function isRTL(code) {
  return LANGUAGES.find((l) => l.code === code)?.dir === "rtl";
}

export function langMeta(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
