import { AlertTriangle, XCircle } from "lucide-react";
import { PlanCard } from "../plans/PlanCard.jsx";
import { countryName } from "../../utils/countries.js";
import { Flag } from "../ui/Flag.jsx";
import "./NoFullCoverageHelper.css";

export function NoFullCoverageHelper({ comboPlans, uncoveredCountries }) {
  return (
    <div className="no-full-coverage">
      <div className="no-full-coverage-banner">
        <AlertTriangle size={20} />
        <div>
          <strong>There's no single eSIM that covers your entire trip.</strong>
          <p>
            Here's the smallest combination of plans that gets you the closest.
          </p>
        </div>
      </div>

      <div className="no-full-coverage-options">
        {comboPlans.map(({ plan, coveredCountries }, i) => (
          <div key={plan.productId} className="no-full-coverage-option">
            <span className="no-full-coverage-option-label">
              Option {i + 1} —{" "}
              {coveredCountries.map((c) => countryName(c)).join(", ")}
            </span>
            <PlanCard plan={plan} />
          </div>
        ))}
      </div>

      {uncoveredCountries.length > 0 && (
        <div className="no-full-coverage-gap">
          <XCircle size={18} />
          <div>
            <strong>We don't currently sell an eSIM for:</strong>{" "}
            <span className="no-full-coverage-gap-list">
              {uncoveredCountries.map((c, i) => (
                <span key={c}>
                  <Flag code={c} size={14} /> {countryName(c)}
                  {i < uncoveredCountries.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
            .
            <p>
              You'll need a local SIM or another provider for that leg of the
              trip.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
