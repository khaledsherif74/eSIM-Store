import { AlertTriangle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlanCard } from "../plans/PlanCard.jsx";
import { countryName } from "../../utils/countries.js";
import { Flag } from "../ui/Flag.jsx";
import "./NoFullCoverageHelper.css";

export function NoFullCoverageHelper({
  comboPlans,
  uncoveredCountries,
  onOpenPlan,
}) {
  const { t } = useTranslation();

  return (
    <div className="no-full-coverage">
      <div className="no-full-coverage-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>{t("NoFullCoverageHelper.banner")}</strong>
          <p>{t("NoFullCoverageHelper.banner_alt")}</p>
        </div>
      </div>

      <div className="no-full-coverage-options">
        {comboPlans.map(({ plan, coveredCountries }, i) => (
          <div key={plan.productId} className="no-full-coverage-option">
            <span className="no-full-coverage-option-label">
              {t("NoFullCoverageHelper.option")} {i + 1} —{" "}
              {coveredCountries.map((c) => countryName(c)).join(", ")}
            </span>
            <PlanCard plan={plan} onOpen={onOpenPlan} />
          </div>
        ))}
      </div>

      {uncoveredCountries.length > 0 && (
        <div className="no-full-coverage-gap">
          <XCircle size={18} />
          <div>
            <strong>{t("NoFullCoverageHelper.gap")}</strong>
            <span className="no-full-coverage-gap-list">
              {uncoveredCountries.map((c, i) => (
                <span key={c}>
                  <Flag code={c} size={14} /> {countryName(c)}
                  {i < uncoveredCountries.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
            .<p>{t("NoFullCoverageHelper.another")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
