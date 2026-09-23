import { Link } from "react-router-dom";
import {
  Check,
  X,
  Wifi,
  Calendar,
  Phone,
  MessageSquare,
  Radio,
} from "lucide-react";

import { Card } from "../ui/Card.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { countryName } from "../../utils/countries.js";
import { Flag } from "../ui/Flag.jsx";
import {
  capabilityLabel,
  capabilityClass,
} from "../../utils/productCapabilities.js";

import "./PlanCard.css";

const Cap = ({ icon: Icon, label, value }) => (
  <span
    className={`plan-capability ${capabilityClass(value)}`}
    title={`${label}: ${capabilityLabel(value)}`}
  >
    <Icon size={13} />
    <span>{label}</span>
  </span>
);

export function PlanCard({ plan, tripBreakdown, highlight, highlightReason }) {
  const isRegional = plan.countries.length > 3;

  const tags = Array.isArray(plan.tags) ? plan.tags : [];

  return (
    <Card
      hoverable
      className={`plan-card${highlight ? " plan-card-highlight" : ""}`}
    >
      {highlight && (
        <div className="plan-card-highlight-banner">
          <Check size={14} />
          {highlightReason || "Recommended"}
        </div>
      )}

      <div className="plan-card-header">
        {plan.providerLogo ? (
          <img src={plan.providerLogo} alt="" className="plan-card-logo" />
        ) : (
          <div className="plan-card-logo plan-card-logo-placeholder">
            {plan.providerName?.[0] || "?"}
          </div>
        )}

        <span className="plan-card-provider">{plan.providerName}</span>

        {plan.requiresKyc && <Badge tone="warning">ID verification</Badge>}
      </div>

      {tags.length > 0 && (
        <div className="plan-card-tags">
          {tags.map((tag, index) => (
            <span
              key={`${tag.item}-${index}`}
              className="plan-card-tag"
              style={{
                backgroundColor: "#2f5fed" || tag.color,
                color: "#e8edfe",
              }}
            >
              {tag.item}
            </span>
          ))}
        </div>
      )}

      <h3 className="plan-card-title">{plan.title}</h3>

      <div className="plan-card-meta">
        <span className="plan-card-meta-item">
          <Wifi size={15} />
          {plan.dataLimit ?? "—"} {plan.dataUnit || ""}
        </span>

        <span className="plan-card-meta-item">
          <Calendar size={15} />
          {plan.validityDays ?? "—"} days
        </span>
      </div>

      <div className="plan-capabilities">
        <Cap icon={Wifi} label="Data" value={plan.capabilities?.data} />

        <Cap icon={Phone} label="Calls" value={plan.capabilities?.calls} />

        <Cap icon={MessageSquare} label="SMS" value={plan.capabilities?.sms} />

        <Cap icon={Radio} label="Hotspot" value={plan.capabilities?.hotspot} />
      </div>

      {tripBreakdown ? (
        <ul className="plan-card-breakdown">
          {tripBreakdown.map(({ code, covered }) => (
            <li key={code} className={covered ? "covered" : "not-covered"}>
              {covered ? <Check size={14} /> : <X size={14} />}

              <Flag code={code} size={14} />

              {countryName(code)}
            </li>
          ))}
        </ul>
      ) : isRegional ? (
        <p className="plan-card-countries">
          Covers {plan.countries.length} countries
        </p>
      ) : (
        <ul className="plan-card-country-chips">
          {plan.countries.map((country) => (
            <li key={country}>
              <Flag code={country} size={14} />
              {countryName(country)}
            </li>
          ))}
        </ul>
      )}

      {plan.description?.summary && (
        <p className="plan-card-summary">{plan.description.summary}</p>
      )}

      <div className="plan-card-footer">
        <div className="plan-card-price">
          ${Number(plan.price).toFixed(2)} <small>{plan.currency}</small>
        </div>

        <Link to={`/plans/${plan.productId}`}>
          <Button size="sm">View plan</Button>
        </Link>
      </div>
    </Card>
  );
}
