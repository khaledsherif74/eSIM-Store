import { useTranslation } from "react-i18next";
import { Construction } from "lucide-react";

export function ComingSoonPage({ titleKey, defaultTitle }) {
  const { t } = useTranslation();
  return (
    <section className="admin-section">
      <header className="admin-section-head">
        <h1>{t(titleKey, defaultTitle)}</h1>
      </header>
      <div className="ash-section-card ash-soon" role="status">
        <Construction size={28} />
        <strong>{t("admin.coming_soon_title", "Coming soon")}</strong>
        <span>
          {t(
            "admin.coming_soon_sub",
            "This section is planned for a later phase.",
          )}
        </span>
      </div>
    </section>
  );
}
