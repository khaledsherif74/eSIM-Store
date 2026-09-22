import { Link } from "react-router-dom";
import { CheckCircle2, CircleHelp, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import "./ContentPage.css";

export function CompatibilityPage() {
  const { t } = useTranslation();

  return (
    <div className="container content-page">
      <header>
        <span className="eyebrow">{t("compatibility.eyebrow")}</span>
        <h1>{t("compatibility.title")}</h1>
        <p>{t("compatibility.subtitle")}</p>
      </header>
      <div className="content-grid">
        <Card>
          <Smartphone size={24} />
          <h2>{t("compatibility.iphone_title")}</h2>
          <p>{t("compatibility.iphone_text")}</p>
        </Card>
        <Card>
          <Smartphone size={24} />
          <h2>{t("compatibility.android_title")}</h2>
          <p>{t("compatibility.android_text")}</p>
        </Card>
      </div>
      <Card className="info-card">
        <CircleHelp size={20} />
        <div>
          <h2>{t("compatibility.check_title")}</h2>
          <p>{t("compatibility.check_text")}</p>
        </div>
      </Card>
      <Link to="/">
        <Button>{t("compatibility.btn_browse")}</Button>
      </Link>
    </div>
  );
}
