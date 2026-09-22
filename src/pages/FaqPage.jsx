import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./ContentPage.css";

export function FaqPage() {
  const { t } = useTranslation();
  const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7"];

  return (
    <div className="container content-page">
      <header>
        <span className="eyebrow">{t("faq.eyebrow")}</span>
        <h1>{t("faq.title")}</h1>
        <p>{t("faq.subtitle")}</p>
      </header>
      <div className="faq-list">
        {faqKeys.map((key) => (
          <details key={key} className="faq-item">
            <summary>
              {t(`faq.questions.${key}`)}
              <ChevronDown size={18} />
            </summary>
            <p>{t(`faq.questions.${key.replace("q", "a")}`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
