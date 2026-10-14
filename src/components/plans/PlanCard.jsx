import { ArrowRight } from "lucide-react";
import { Card } from "../ui/Card.jsx";
import { Flag } from "../ui/Flag.jsx";
import { countryName } from "../../utils/countries.js";
import { useCurrency } from "../../i18n/CurrencyContext.jsx";
import "./PlanCard.css";

function formatPrice(n) {
  return Number(n).toFixed(2);
}

function CountriesCell({ countries, searchCountries }) {
  if (!countries || countries.length === 0) {
    return <span className="plan-card-country-name">—</span>;
  }

  const searched =
    Array.isArray(searchCountries) && searchCountries.length
      ? countries.filter((c) => searchCountries.includes(c))
      : [];

  if (searched.length >= 2) {
    const shown = searched.slice(0, 3);
    const remaining = countries.length - shown.length;
    return (
      <>
        {shown.map((code) => (
          <Flag key={code} code={code} size={14} />
        ))}
        {remaining > 0 && (
          <span className="plan-card-country-more">+{remaining}</span>
        )}
      </>
    );
  }

  if (searched.length === 1) {
    const [primary, ...rest] = countries;
    const extraFlags = rest.slice(0, 2);
    const remainingCount = rest.length - extraFlags.length;
    return (
      <>
        <Flag code={primary} size={14} />
        <span className="plan-card-country-name">{countryName(primary)}</span>
        {extraFlags.map((code) => (
          <Flag key={code} code={code} size={14} />
        ))}
        {remainingCount > 0 && (
          <span className="plan-card-country-more">+{remainingCount}</span>
        )}
      </>
    );
  }

  if (countries.length === 1) {
    return (
      <>
        <Flag code={countries[0]} size={14} />
        <span className="plan-card-country-name">
          {countryName(countries[0])}
        </span>
      </>
    );
  }

  if (countries.length === 2) {
    return (
      <>
        <Flag code={countries[0]} size={14} />
        <Flag code={countries[1]} size={14} />
      </>
    );
  }

  const extraFlags = countries.slice(1, 3);
  const remainingCount = countries.length - 1 - extraFlags.length;
  return (
    <>
      <Flag code={countries[0]} size={14} />
      <span className="plan-card-country-name">
        {countryName(countries[0])}
      </span>
      {extraFlags.map((code) => (
        <Flag key={code} code={code} size={14} />
      ))}
      {remainingCount > 0 && (
        <span className="plan-card-country-more">+{remainingCount}</span>
      )}
    </>
  );
}

export function PlanCard({
  plan,
  tripBreakdown,
  searchCountries,
  highlight,
  highlightReason,
  onOpen,
}) {
  const { format } = useCurrency();
  const approx = format(plan.price);

  const clickable = typeof onOpen === "function";
  const handleClick = clickable ? () => onOpen(plan.productId) : undefined;
  const handleKeyDown = clickable
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(plan.productId);
        }
      }
    : undefined;

  const primaryTag =
    Array.isArray(plan.tags) && plan.tags.length ? plan.tags[0]?.item : null;
  const has5G = plan.capabilities?.fiveG === "included";
  const isUnlimited = plan.capabilities?.unlimited === true;

  return (
    <Card
      id={`plan-card-${plan.productId}`}
      hoverable
      className={`plan-card${highlight ? " plan-card-highlight" : ""}${
        clickable ? " plan-card-clickable" : ""
      }`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="plan-card-top">
        <div className="plan-card-brand">
          {plan.providerLogo ? (
            <img src={plan.providerLogo} alt="" className="plan-card-logo" />
          ) : (
            <div className="plan-card-logo plan-card-logo-placeholder">
              {plan.providerName?.[0] || "?"}
            </div>
          )}
          <div className="plan-card-brand-text">
            <h3 className="plan-card-title">{plan.title}</h3>
            <span className="plan-card-provider">{plan.providerName}</span>
          </div>
        </div>
        <div className="plan-card-badges">
          {primaryTag && <span className="plan-card-tag">{primaryTag}</span>}
          {has5G && <span className="plan-card-5g">5G</span>}
        </div>
      </div>

      <div className="plan-card-stats">
        <div className="plan-card-stat">
          <strong>
            {plan.validityDays ?? "—"}
            <span className="plan-card-stat-unit"> days</span>
          </strong>
        </div>
        <div className="plan-card-stat">
          <strong>
            {isUnlimited ? "Unlimited" : (plan.dataLimit ?? "—")}
            {!isUnlimited && (
              <span className="plan-card-stat-unit">
                {" "}
                {plan.dataUnit || ""}
              </span>
            )}
          </strong>
        </div>
        <div className="plan-card-stat plan-card-stat-price">
          <strong>${formatPrice(plan.price)}</strong>
          {approx && <small className="plan-card-price-approx">{approx}</small>}
        </div>
      </div>

      <div className="plan-card-bottom">
        <div className="plan-card-country">
          {tripBreakdown ? (
            <span className="plan-card-trip">
              {tripBreakdown.filter((c) => c.covered).length}/
              {tripBreakdown.length} covered
            </span>
          ) : (
            <CountriesCell
              countries={plan.countries}
              searchCountries={searchCountries}
            />
          )}
        </div>
        <span className="plan-card-cta">
          View offer <ArrowRight size={13} />
        </span>
      </div>
    </Card>
  );
}
