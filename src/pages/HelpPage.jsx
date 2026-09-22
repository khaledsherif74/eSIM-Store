import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CircleHelp, Smartphone, Activity } from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { OrderLookupCard } from "../components/esim/OrderLookupCard.jsx";
import "./ContentPage.css";

export function HelpPage() {
  const { t } = useTranslation();
  return (
    <div className="container content-page">
      <header>
        <span className="eyebrow">{t("help.eyebrow")}</span>
        <h1>{t("help.title")}</h1>
        <p>{t("help.subtitle")}</p>
      </header>
      <OrderLookupCard title={t("help.lookup_title")} description={t("help.lookup_desc")} />
      <div className="content-grid">
        <Card>
          <Activity size={24} />
          <h2>{t("help.usage_title")}</h2>
          <p>{t("help.usage_desc")}</p>
          <Link to="/my-esims">
            <Button variant="secondary">{t("help.manage_esims")}</Button>
          </Link>
        </Card>
        <Card>
          <Smartphone size={24} />
          <h2>{t("help.install_title")}</h2>
          <p>{t("help.install_desc")}</p>
          <Link to="/installation">
            <Button variant="secondary">{t("help.installation_guide")}</Button>
          </Link>
        </Card>
        <Card>
          <BookOpen size={24} />
          <h2>{t("help.compat_title")}</h2>
          <p>{t("help.compat_desc")}</p>
          <Link to="/compatibility">
            <Button variant="secondary">{t("help.check_compatibility")}</Button>
          </Link>
        </Card>
        <Card>
          <CircleHelp size={24} />
          <h2>{t("help.faq_title")}</h2>
          <p>{t("help.faq_desc")}</p>
          <Link to="/faq">
            <Button variant="secondary">{t("help.read_faqs")}</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
