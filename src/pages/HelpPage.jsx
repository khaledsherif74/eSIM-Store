import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CircleHelp,
  KeyRound,
  Mail,
  Smartphone,
  Activity,
} from "lucide-react";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { apiClient } from "../services/apiClient.js";
import "./ContentPage.css";

export function HelpPage() {
  const { t } = useTranslation();
  const [supportEmail, setSupportEmail] = useState("");

  useEffect(() => {
    let alive = true;
    apiClient
      .get("/api/site-info")
      .then((info) => alive && setSupportEmail(info?.supportEmail || ""))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container content-page">
      <header>
        <span className="eyebrow">{t("help.eyebrow")}</span>
        <h1>{t("help.title")}</h1>
        <p>{t("help.subtitle")}</p>
      </header>

      <Card className="help-reopen-card">
        <KeyRound size={22} />
        <div>
          <h2>{t("help.reopen_title")}</h2>
          <p>{t("help.reopen_desc")}</p>
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`} className="help-reopen-cta">
              <Button variant="secondary" icon={<Mail size={14} />}>
                {t("help.reopen_contact", { email: supportEmail })}
              </Button>
            </a>
          ) : (
            <p className="help-reopen-fallback">{t("help.reopen_fallback")}</p>
          )}
        </div>
      </Card>

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
