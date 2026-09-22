import { Link } from "react-router-dom";
import { Apple, CheckCircle2, ExternalLink, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import "./ContentPage.css";

export function InstallationPage() {
  const { t } = useTranslation();

  return (
    <div className="container content-page">
      <header>
        <span className="eyebrow">{t("installation.eyebrow")}</span>
        <h1>{t("installation.title")}</h1>
        <p>{t("installation.subtitle")}</p>
      </header>
      <div className="content-grid">
        <Card>
          <Apple size={24} />
          <h2>{t("installation.iphone_title")}</h2>
          <ol>
            <li>{t("installation.iphone_step1")}</li>
            <li>{t("installation.iphone_step2")}</li>
            <li>{t("installation.iphone_step3")}</li>
            <li>{t("installation.iphone_step4")}</li>
            <li>{t("installation.iphone_step5")}</li>
          </ol>
        </Card>
        <Card>
          <Smartphone size={24} />
          <h2>{t("installation.android_title")}</h2>
          <ol>
            <li>{t("installation.android_step1")}</li>
            <li>{t("installation.android_step2")}</li>
            <li>{t("installation.android_step3")}</li>
            <li>{t("installation.android_step4")}</li>
          </ol>
        </Card>
      </div>
      <Card className="info-card">
        <CheckCircle2 size={20} />
        <div>
          <h2>{t("installation.after_install_title")}</h2>
          <p>{t("installation.after_install_text")}</p>
        </div>
      </Card>
      <div className="content-actions">
        <Link to="/my-esims">
          <Button>{t("installation.btn_my_esims")}</Button>
        </Link>
        <a href="https://www.mobimatter.com/" target="_blank" rel="noreferrer">
          <Button variant="secondary">
            {t("installation.btn_partner_site")} <ExternalLink size={15} />
          </Button>
        </a>
      </div>
    </div>
  );
}
