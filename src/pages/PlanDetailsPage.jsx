import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Activity, Calendar, CheckCircle2, Globe2, MessageSquare, Phone, Radio, ShieldCheck, Smartphone, Wifi, Network, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { useProducts } from "../hooks/useProducts.js";
import { selectProductById } from "../store/slices/productsSlice.js";
import { productsApi } from "../services/productsApi.js";
import { countryName } from "../utils/countries.js";
import { Flag } from "../components/ui/Flag.jsx";
import { capabilityLabel, capabilityClass } from "../utils/productCapabilities.js";
import "./PlanDetailsPage.css";

const Cap = ({ icon: Icon, label, value }) => (
  <div className={`plan-detail-cap ${capabilityClass(value)}`}>
    <Icon size={20} />
    <div>
      <strong>{label}</strong>
      <span>{capabilityLabel(value)}</span>
    </div>
  </div>
);

export function PlanDetailsPage() {
  const { t } = useTranslation();
  const { productId } = useParams();
  const nav = useNavigate();
  const { isLoading } = useProducts();
  const plan = useSelector((s) => selectProductById(s, productId));
  const [networks, setNetworks] = useState([]);
  const [netLoading, setNetLoading] = useState(false);

  useEffect(() => {
    if (!plan) return;
    setNetLoading(true);
    productsApi
      .getProductNetworks(plan.productId)
      .then((r) => setNetworks(r.networks || []))
      .catch(() => {})
      .finally(() => setNetLoading(false));
  }, [plan]);

  if (isLoading) {
    return (
      <div className="container plan-details-loading">
        <Spinner label={t("plan_details.loading")} />
      </div>
    );
  }
  if (!plan) {
    return (
      <div className="container plan-details-notfound">
        <h1>{t("plan_details.not_found")}</h1>
        <Link to="/">
          <Button variant="secondary">{t("plan_details.browse_others")}</Button>
        </Link>
      </div>
    );
  }

  const managementOnly = plan.category === "esim_addon" || plan.category === "esim_replacement";
  const details = plan.description?.items || [];

  return (
    <div className="container plan-details-page">
      <div className="plan-details-grid">
        <main className="plan-details-main">
          <div className="plan-details-provider">
            {plan.providerLogo ? <img src={plan.providerLogo} alt="" /> : <span className="plan-details-provider-fallback">{plan.providerName?.[0]}</span>}
            <span>{plan.providerName}</span>
            {plan.requiresKyc && <Badge tone="warning">{t("plan_details.id_verification_required")}</Badge>}
          </div>
          <h1>{plan.title}</h1>
          {plan.description?.summary && <p className="plan-details-summary">{plan.description.summary}</p>}

          <div className="plan-details-stats">
            <Card className="plan-details-stat">
              <Wifi size={20} />
              <div>
                <strong>{plan.dataLimit ?? "—"} {plan.dataUnit || ""}</strong>
                <span>{t("plan_details.data_allowance")}</span>
              </div>
            </Card>
            <Card className="plan-details-stat">
              <Calendar size={20} />
              <div>
                <strong>{plan.validityDays ?? "—"} {t("plan_details.days")}</strong>
                <span>{t("plan_details.validity")}</span>
              </div>
            </Card>
            <Card className="plan-details-stat">
              <Globe2 size={20} />
              <div>
                <strong>{plan.countries.length}</strong>
                <span>{t("plan_details.countries")}</span>
              </div>
            </Card>
          </div>

          <section className="plan-details-section">
            <div className="detail-section-title">
              <h2>{t("plan_details.capabilities_title")}</h2>
              <span>{t("plan_details.capabilities_subtitle")}</span>
            </div>
            <div className="plan-detail-cap-grid">
              <Cap icon={Wifi} label={t("plan_details.mobile_data")} value={plan.capabilities?.data} />
              <Cap icon={Phone} label={t("plan_details.voice_calls")} value={plan.capabilities?.calls} />
              <Cap icon={MessageSquare} label={t("plan_details.sms")} value={plan.capabilities?.sms} />
              <Cap icon={Radio} label={t("plan_details.hotspot")} value={plan.capabilities?.hotspot} />
            </div>
            <p className="plan-detail-help">{t("plan_details.not_specified_note")}</p>
          </section>

          {plan.requiresKyc && (
            <div className="plan-details-kyc">
              <ShieldCheck size={18} />
              <span>{t("plan_details.kyc_note")}</span>
            </div>
          )}

          <section className="plan-details-section">
            <div className="detail-section-title">
              <h2>{t("plan_details.coverage")}</h2>
              <span>{plan.countries.length} {t("plan_details.destinations")}</span>
            </div>
            <div className="plan-details-country-grid">
              {plan.countries.map((c) => (
                <div key={c}>
                  <span><Flag code={c} size={20} /></span>
                  <strong>{countryName(c)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="plan-details-section">
            <div className="detail-section-title">
              <h2>{t("plan_details.networks")}</h2>
              <Network size={18} />
            </div>
            {netLoading ? (
              <Spinner label={t("plan_details.loading_networks")} />
            ) : networks.length ? (
              <div className="plan-networks">
                {networks.map((n, i) => (
                  <div key={i}>
                    <strong>{n.name || n.networkName || n.operator || t("plan_details.mobile_network")}</strong>
                    <span>{n.country || n.countryCode || n.mccmnc || t("plan_details.provider_network")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">{t("plan_details.no_network_data")}</p>
            )}
          </section>

          {details.length > 0 && (
            <section className="plan-details-section">
              <div className="detail-section-title">
                <h2>{t("plan_details.plan_information")}</h2>
                <Activity size={18} />
              </div>
              <ul className="plan-details-list">
                {details.map((x, i) => (
                  <li key={i}><CheckCircle2 size={16} />{x}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="plan-details-section">
            <div className="detail-section-title">
              <h2>{t("plan_details.before_you_buy")}</h2>
            </div>
            <div className="plan-before-buy">
              <p><Smartphone size={17} /><span>{t("plan_details.device_note")}</span></p>
              <p><Wifi size={17} /><span>{t("plan_details.rules_note")}</span></p>
              <p><ArrowRight size={17} /><span>{t("plan_details.after_purchase_note")}</span></p>
            </div>
          </section>
        </main>

        <aside className="plan-details-sidebar">
          <Card className="plan-details-purchase-card">
            <span className="eyebrow">{plan.requiresKyc ? t("plan_details.verification_plan") : t("plan_details.travel_esim")}</span>
            <div className="plan-details-price">${Number(plan.price).toFixed(2)} <small>{plan.currency}</small></div>
            <div className="purchase-facts">
              <span><Wifi size={14} /> {plan.dataLimit ?? "—"} {plan.dataUnit || ""}</span>
              <span><Calendar size={14} /> {plan.validityDays ?? "—"} {t("plan_details.days")}</span>
              <span><Globe2 size={14} /> {plan.countries.length} {t("plan_details.countries")}</span>
            </div>
            {managementOnly ? (
              <Button fullWidth size="lg" disabled>{t("plan_details.unavailable_management_only")}</Button>
            ) : (
              <Button fullWidth size="lg" onClick={() => nav(`/checkout/${plan.productId}`)}>{t("plan_details.buy_button")}</Button>
            )}
            <p className="plan-details-purchase-note"><ShieldCheck size={14} /> {t("plan_details.secure_payment")}</p>
          </Card>
          <Card>
            <h3>{t("plan_details.need_help_choosing")}</h3>
            <p className="muted">{t("plan_details.trip_helper_note")}</p>
            <Link to="/">
              <Button variant="secondary" fullWidth>{t("plan_details.plan_your_trip")}</Button>
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
