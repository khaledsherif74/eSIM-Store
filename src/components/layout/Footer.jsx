import { Link } from "react-router-dom";
import { ShieldCheck, Smartphone, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import "./Footer.css";

export function Footer() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand"><span className="footer-brand-mark">e</span><div><strong>eSIM Store</strong><span>{t("footer.tagline")}</span></div></div>
        <div className="footer-links">
          <Link to="/">{t("footer.browse_plans")}</Link>
          <Link to="/my-esims"><Smartphone size={14}/> {t("footer.my_esims")}</Link>
          <button
            type="button"
            className="footer-lang-toggle"
            onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            aria-label="Switch language"
          >
            <Languages size={14} />
            {t("footer.language")}
          </button>
        </div>
        <div className="footer-links"><Link to="/installation">{t("footer.installation")}</Link><Link to="/compatibility">{t("footer.compatibility")}</Link><Link to="/faq">{t("footer.faq")}</Link><Link to="/help">{t("footer.support")}</Link></div>
        <div className="footer-trust"><ShieldCheck size={18}/><span>{t("footer.trust_note")}</span></div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {t("footer.copyright")}</span>
        <span>{t("footer.sourced_note")}</span>
      </div>
    </footer>
  );
}
