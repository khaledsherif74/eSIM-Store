import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, Check, Copy, ExternalLink, Globe2, History, RefreshCw, Smartphone, Wifi, Phone, MessageSquare, Radio, ShieldCheck, RotateCcw } from "lucide-react";
import { ordersApi } from "../services/ordersApi.js";
import { productsApi } from "../services/productsApi.js";
import { useProducts } from "../hooks/useProducts.js";
import { Badge } from "../components/ui/Badge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { NetworkErrorBanner } from "../components/ui/NetworkErrorBanner.jsx";
import { Flag } from "../components/ui/Flag.jsx";
import { getApn, getIccid, getLpa, getOneClickInstall, getPhoneNumber, getQrValue, getSmdp, getActivationCode, statusMeta, formatDate, getKycUrl, isRechargeable } from "../utils/orderData.js";
import { getOrderAccess, rememberOrder } from "../utils/orderStorage.js";
import { capabilityLabel, capabilityClass } from "../utils/productCapabilities.js";
import { countryName } from "../utils/countries.js";
import "./EsimDetailsPage.css";

function Detail({ label, value, copyable = false }) {
  if (!value) return null;
  return (
    <div className="esim-detail-row">
      <span>{label}</span>
      <div>
        <code>{value}</code>
        {copyable && (
          <button type="button" onClick={() => navigator.clipboard?.writeText(String(value))} aria-label={`Copy ${label}`}>
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

const Cap = ({ icon: Icon, label, value }) => (
  <div className={`esim-capability ${capabilityClass(value)}`}>
    <Icon size={19} />
    <div>
      <strong>{label}</strong>
      <span>{capabilityLabel(value)}</span>
    </div>
  </div>
);

export function EsimDetailsPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const { products } = useProducts();
  const [order, setOrder] = useState(null);
  const [usage, setUsage] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [refund, setRefund] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const id = decodeURIComponent(orderId || "");
  const token = params.get("token") || getOrderAccess(id)?.token;

  const product = useMemo(() => (order?.productId ? products.find((p) => p.productId === order.productId) : null), [order, products]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await ordersApi.getOrder(id, token);
      setOrder(r);
      rememberOrder(id, token);
      if (r.productId) {
        productsApi.getProductNetworks(r.productId).then((x) => setNetworks(x.networks || [])).catch(() => {});
      }
    } catch (e) {
      setError(e.message || "Couldn't load order.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  async function loadUsage() {
    setBusy(true);
    try {
      setUsage(await ordersApi.getUsage(id, token));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadRefund() {
    setBusy(true);
    try {
      setRefund(await ordersApi.getRefundEligibility(id, token));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function loadHistory() {
    setBusy(true);
    try {
      setHistory(await ordersApi.getHistory(id, token));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="container esim-details-page">
        <Spinner label={t("esim_details.loading")} />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="container esim-details-page">
        <Card>
          <h1>{t("esim_details.unavailable")}</h1>
          <p>{error || t("esim_details.unavailable_note")}</p>
          <Link to="/my-esims"><Button>{t("esim_details.back_link")}</Button></Link>
        </Card>
      </div>
    );
  }

  const [statusLabel, tone] = statusMeta(order.status);
  const qr = getQrValue(order);
  const lpa = getLpa(order);
  const oneClick = getOneClickInstall(order);
  const caps = product?.capabilities || {};
  const kyc = getKycUrl(order);
  const completed = order.status === "Completed";
  const canTopUp = isRechargeable(order);

  return (
    <div className="container esim-details-page">
      {error && <NetworkErrorBanner error={error} />}
      <div className="esim-details-header">
        <div>
          <Link to="/my-esims" className="back-link">← {t("esim_details.back_link")}</Link>
          <div className="esim-details-title-row">
            <div>{product?.providerLogo && <img src={product.providerLogo} alt="" className="esim-provider-logo" />}</div>
            <div>
              <span className="eyebrow">{product?.providerName || "eSIM"}</span>
              <h1>{product?.title || order.productId}</h1>
              <p>{t("esim_details.order_label")} {order.orderId} · {formatDate(order.createdAt)}</p>
            </div>
            <Badge tone={tone}>{statusLabel}</Badge>
          </div>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={load}>{t("esim_details.refresh")}</Button>
      </div>

      <section className="esim-overview-grid">
        <Card>
          <span className="eyebrow">{t("esim_details.your_plan")}</span>
          <h2>{product?.title || order.productId}</h2>
          <div className="esim-plan-stats">
            <div><strong>{product?.dataLimit ?? "—"} {product?.dataUnit || ""}</strong><span>{t("esim_details.data")}</span></div>
            <div><strong>{product?.validityDays ?? "—"} {t("plan_details.days")}</strong><span>{t("esim_details.validity")}</span></div>
            <div><strong>{product?.countries?.length || 0}</strong><span>{t("esim_details.countries")}</span></div>
          </div>
          <div className="esim-capabilities-grid">
            <Cap icon={Wifi} label={t("esim_details.data")} value={caps.data} />
            <Cap icon={Phone} label={t("esim_details.calls")} value={caps.calls} />
            <Cap icon={MessageSquare} label={t("esim_details.sms")} value={caps.sms} />
            <Cap icon={Radio} label={t("esim_details.hotspot")} value={caps.hotspot} />
          </div>
        </Card>
        <Card>
          <span className="eyebrow">{t("plan_details.coverage")}</span>
          <h2><Globe2 size={19} /> {t("esim_details.coverage")}</h2>
          <div className="coverage-chip-grid">
            {(product?.countries || []).map((c) => (
              <Badge key={c}><Flag code={c} size={14} /> {countryName(c)}</Badge>
            ))}
          </div>
          {product?.description?.summary && <p className="muted">{product.description.summary}</p>}
        </Card>
      </section>

      {order.status === "Processing" && kyc && (
        <Card className="esim-kyc-card">
          <ShieldCheck size={22} />
          <div>
            <h2>{t("esim_details.kyc_title")}</h2>
            <p>{t("esim_details.kyc_note")}</p>
            <a href={kyc} target="_blank" rel="noreferrer">
              <Button>{t("esim_details.continue_kyc")} <ExternalLink size={15} /></Button>
            </a>
          </div>
        </Card>
      )}

      {completed && (
        <section className="esim-details-main-grid">
          <Card className="esim-install-card">
            <div className="esim-install-heading">
              <div>
                <span className="eyebrow">{t("esim_details.install_eyebrow")}</span>
                <h2>{t("esim_details.install_title")}</h2>
                <p>{t("esim_details.install_subtitle")}</p>
              </div>
              <Smartphone size={28} />
            </div>
            {oneClick && (
              <div className="esim-oneclick-grid">
                {oneClick.ios && (
                  <a className="install-button" href={oneClick.ios}>
                    <strong>{t("esim_details.one_click_iphone")}</strong>
                    <small>{t("esim_details.one_click_label")}</small>
                    <ExternalLink size={16} />
                  </a>
                )}
                {oneClick.android && (
                  <a className="install-button" href={oneClick.android}>
                    <strong>{t("esim_details.one_click_android")}</strong>
                    <small>{t("esim_details.one_click_label")}</small>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            )}
            {qr && (
              <div className="esim-qr-wrap">
                <img src={qr} alt="eSIM QR code" className="esim-qr" />
                <p>{t("esim_details.qr_note")}</p>
              </div>
            )}
            <div className="esim-detail-list">
              <Detail label={t("esim_details.lpa")} value={lpa} copyable />
              <Detail label={t("esim_details.smdp")} value={getSmdp(order)} copyable />
              <Detail label={t("esim_details.activation_code")} value={getActivationCode(order)} copyable />
              <Detail label={t("esim_details.iccid")} value={getIccid(order)} copyable />
              <Detail label={t("esim_details.apn")} value={getApn(order)} copyable />
              <Detail label={t("esim_details.phone_number")} value={getPhoneNumber(order)} />
            </div>
            <Link to="/installation"><Button variant="secondary" fullWidth>{t("esim_details.installation_guide")}</Button></Link>
          </Card>

          <div className="esim-side-stack">
            <Card>
              <div className="card-section-head"><h2>{t("esim_details.usage")}</h2><Wifi size={18} /></div>
              <Button fullWidth disabled={busy} onClick={loadUsage}>{busy ? t("esim_details.checking") : t("esim_details.check_usage")}</Button>
              {usage && (
                <div className="usage-result">
                  <div><strong>{formatMb(usage.remainingMB)}</strong><span>{t("esim_details.remaining")}</span></div>
                  <div><strong>{formatMb(usage.usedMB)}</strong><span>{t("esim_details.used")}</span></div>
                  {usage.rechargeable != null && (
                    <small>{t("esim_details.topup_label")}: {usage.rechargeable ? t("esim_details.topup_available") : t("esim_details.topup_unavailable")}</small>
                  )}
                </div>
              )}
            </Card>

            <Card>
              <div className="card-section-head"><h2>{t("esim_details.networks")}</h2><Globe2 size={18} /></div>
              {networks.length ? (
                <div className="network-list">
                  {networks.map((n, i) => (
                    <div key={i}>
                      <strong>{n.name || n.networkName || n.operator || `${t("esim_details.available_network")} ${i + 1}`}</strong>
                      <span>{n.country || n.countryCode || n.mccmnc || t("esim_details.available_network")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">{t("esim_details.no_network_details")}</p>
              )}
            </Card>

            <Card>
              <div className="card-section-head"><h2>{t("esim_details.order_history")}</h2><History size={18} /></div>
              <Button fullWidth variant="secondary" disabled={busy} onClick={loadHistory}>{t("esim_details.view_history")}</Button>
              {history.length > 0 && (
                <div className="history-list">
                  {history.map((h) => (
                    <div key={h.id}><strong>{statusMeta(h.status)[0]}</strong><span>{formatDate(h.createdAt)}</span></div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="card-section-head"><h2>{t("esim_details.need_help")}</h2><RotateCcw size={18} /></div>
              <Button fullWidth variant="secondary" disabled={busy} onClick={loadRefund}>{t("esim_details.check_refund")}</Button>
              {refund && (
                <p className="muted">
                  {refund.isEligible ? `${t("esim_details.eligible")}${refund.fee ? ` · ${t("esim_details.fee")} ${refund.fee}` : ""}` : refund.reason || t("esim_details.not_eligible")}
                </p>
              )}
              <div className="action-stack">
                {canTopUp && <Link to={`/top-up/${encodeURIComponent(id)}`}><Button fullWidth variant="secondary">{t("esim_details.top_up_data")}</Button></Link>}
                <Link to={`/replace/${encodeURIComponent(id)}`}><Button fullWidth variant="secondary">{t("esim_details.replace_esim")}</Button></Link>
              </div>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

function formatMb(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const mb = Number(value);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}
