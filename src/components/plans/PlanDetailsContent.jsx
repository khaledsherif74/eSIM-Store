import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Gauge,
  Globe2,
  Hash,
  MapPin,
  MessageSquare,
  Network,
  Phone,
  Radio,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi,
  Zap,
} from "lucide-react";
import { useCurrency } from "../../i18n/CurrencyContext.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Flag } from "../ui/Flag.jsx";
import { countryName } from "../../utils/countries.js";
import {
  capabilityLabel,
  capabilityClass,
} from "../../utils/productCapabilities.js";

const Cap = ({ icon: Icon, label, value }) => (
  <div className={`plan-detail-cap ${capabilityClass(value)}`}>
    <Icon size={18} />
    <div>
      <strong>{label}</strong>
      <span>{capabilityLabel(value)}</span>
    </div>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value || value === "unknown" || value === "not_included") return null;
  return (
    <div className="plan-good-row">
      <Icon size={18} className="plan-good-icon" />
      <div className="plan-good-text">
        <span className="plan-good-label">{label}</span>
        <strong className="plan-good-value">{value}</strong>
      </div>
    </div>
  );
};

export function PlanDetailsContent({ plan, onBack }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { format } = useCurrency();

  if (!plan) return null;

  const managementOnly =
    plan.category === "esim_addon" || plan.category === "esim_replacement";
  const details = plan.description?.items || [];
  const caps = plan.capabilities || {};

  const handleBack =
    onBack || (() => (window.history.length > 1 ? nav(-1) : nav("/")));

  const goodToKnow = [
    { icon: Network, label: "Network", value: caps.networksShort },
    {
      icon: RefreshCw,
      label: "Activation policy",
      value: caps.activationPolicy,
    },
    { icon: MapPin, label: "IP routing", value: caps.ipBreakout },
    {
      icon: Radio,
      label: "Hotspot",
      value:
        caps.hotspot === "included"
          ? "Available"
          : caps.hotspot === "not_included"
            ? "Not available"
            : null,
    },
    { icon: Gauge, label: "Speed", value: caps.speed },
    {
      icon: RefreshCw,
      label: "Top-up",
      value: caps.rechargeable ? "Available" : "Not available",
    },
    { icon: BookOpen, label: "Usage tracking", value: caps.usageTracking },
    { icon: Hash, label: "Local number", value: caps.phoneNumberPrefix },
  ];

  const hasGoodToKnow = goodToKnow.some((r) => r.value);

  return (
    <>
      <button type="button" className="plan-details-back" onClick={handleBack}>
        <ArrowLeft size={16} /> {t("plan_details.back")}
      </button>

      <div className="plan-details-provider">
        {plan.providerLogo ? (
          <img src={plan.providerLogo} alt="" />
        ) : (
          <span className="plan-details-provider-fallback">
            {plan.providerName?.[0]}
          </span>
        )}
        <span>{plan.providerName}</span>
        {plan.requiresKyc && (
          <Badge tone="warning">
            {t("plan_details.id_verification_required")}
          </Badge>
        )}
        {caps.fiveG === "included" && <Badge tone="primary">5G</Badge>}
        {caps.unlimited && <Badge tone="success">Unlimited</Badge>}
      </div>

      <h1 className="plan-details-title">{plan.title}</h1>

      {plan.description?.summary && (
        <p className="plan-details-summary">{plan.description.summary}</p>
      )}

      {plan.description?.attention && (
        <div className="plan-details-attention" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Attention</strong>
            <p>{plan.description.attention}</p>
          </div>
        </div>
      )}

      <div className="plan-details-stats">
        <div className="plan-details-stat">
          <Wifi size={18} />
          <div>
            <strong>
              {caps.unlimited ? "Unlimited" : (plan.dataLimit ?? "—")}{" "}
              {!caps.unlimited && (plan.dataUnit || "")}
            </strong>
            <span>{t("plan_details.data_allowance")}</span>
          </div>
        </div>
        <div className="plan-details-stat">
          <Calendar size={18} />
          <div>
            <strong>
              {plan.validityDays ?? "—"} {t("plan_details.days")}
            </strong>
            <span>{t("plan_details.validity")}</span>
          </div>
        </div>
        <div className="plan-details-stat">
          <Globe2 size={18} />
          <div>
            <strong>{plan.countries.length}</strong>
            <span>{t("plan_details.countries")}</span>
          </div>
        </div>
      </div>

      <div className="plan-details-purchase-bar">
        <div className="plan-details-price-block">
          <div className="plan-details-price">
            ${Number(plan.price).toFixed(2)} <small>{plan.currency}</small>
          </div>
          {format(plan.price) && (
            <div className="plan-details-price-approx">
              {format(plan.price)}
            </div>
          )}
          <div className="plan-details-purchase-note">
            <ShieldCheck size={13} /> {t("plan_details.secure_payment")}
          </div>
        </div>

        {managementOnly ? (
          <Button size="lg" disabled>
            {t("plan_details.unavailable_management_only")}
          </Button>
        ) : (
          <Button size="lg" onClick={() => nav(`/checkout/${plan.productId}`)}>
            {t("plan_details.buy_button")}
          </Button>
        )}
      </div>

      <section className="plan-details-section">
        <div className="detail-section-title">
          <h2>{t("plan_details.capabilities_title")}</h2>
        </div>
        <div className="plan-detail-cap-grid">
          <Cap
            icon={Wifi}
            label={t("plan_details.mobile_data")}
            value={caps.data}
          />
          <Cap
            icon={Phone}
            label={t("plan_details.voice_calls")}
            value={caps.calls}
          />
          <Cap
            icon={MessageSquare}
            label={t("plan_details.sms")}
            value={caps.sms}
          />
          <Cap
            icon={Radio}
            label={t("plan_details.hotspot")}
            value={caps.hotspot}
          />
        </div>
        <p className="plan-detail-help">
          {t("plan_details.not_specified_note")}
        </p>
      </section>

      {hasGoodToKnow && (
        <section className="plan-details-section">
          <div className="detail-section-title">
            <h2>Good to know</h2>
            <Zap size={18} />
          </div>
          <div className="plan-good-grid">
            {goodToKnow.map((row) => (
              <InfoRow
                key={row.label}
                icon={row.icon}
                label={row.label}
                value={row.value}
              />
            ))}
          </div>
        </section>
      )}

      {plan.requiresKyc && (
        <div className="plan-details-kyc">
          <ShieldCheck size={18} />
          <span>{t("plan_details.kyc_note")}</span>
        </div>
      )}

      {details.length > 0 && (
        <section className="plan-details-section">
          <div className="detail-section-title">
            <h2>{t("plan_details.plan_information")}</h2>
            <Activity size={18} />
          </div>
          <ul className="plan-details-list">
            {details.map((x, i) => (
              <li key={i}>
                <CheckCircle2 size={16} />
                {x}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="plan-details-section">
        <div className="detail-section-title">
          <h2>{t("plan_details.before_you_buy")}</h2>
        </div>
        <div className="plan-before-buy">
          <p>
            <Smartphone size={17} />
            <span>{t("plan_details.device_note")}</span>
          </p>
          <p>
            <Wifi size={17} />
            <span>{t("plan_details.rules_note")}</span>
          </p>
          <p>
            <ArrowRight size={17} />
            <span>{t("plan_details.after_purchase_note")}</span>
          </p>
        </div>
      </section>

      <section className="plan-details-section">
        <div className="detail-section-title">
          <h2>{t("plan_details.coverage")}</h2>
          <span>
            {plan.countries.length} {t("plan_details.destinations")}
          </span>
        </div>
        <div className="plan-details-country-grid">
          {plan.countries.map((c) => (
            <div key={c}>
              <span>
                <Flag code={c} size={20} />
              </span>
              <strong>{countryName(c)}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
