import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, CreditCard, RefreshCw, ArrowLeft, Wallet } from "lucide-react";
import { useProducts } from "../hooks/useProducts.js";
import { ordersApi } from "../services/ordersApi.js";
import { walletApi } from "../services/walletApi.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { selectAllProducts } from "../store/slices/productsSlice.js";
import { useSelector } from "react-redux";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { NetworkErrorBanner } from "../components/ui/NetworkErrorBanner.jsx";
import { getIccid, getLpa, statusMeta } from "../utils/orderData.js";
import { getOrderAccess, rememberOrder } from "../utils/orderStorage.js";
import "./RelatedPurchasePage.css";
export function RelatedPurchasePage({ mode }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const id = decodeURIComponent(orderId || "");
  const token = params.get("token") || getOrderAccess(id)?.token;
  const { isLoading: productsLoading } = useProducts();
  const products = useSelector(selectAllProducts);
  const [order, setOrder] = useState(null),
    [usage, setUsage] = useState(null),
    [selected, setSelected] = useState(null),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [walletBalance, setWalletBalance] = useState(null),
    [paymentMethod, setPaymentMethod] = useState("card"),
    [error, setError] = useState(null);
  const isTopUp = mode === "topup";
  useEffect(() => {
    if (!user) return;
    let alive = true;
    walletApi
      .getBalance()
      .then((r) => alive && setWalletBalance(Number(r.balance)))
      .catch(() => alive && setWalletBalance(null));
    return () => {
      alive = false;
    };
  }, [user]);
  const canPayWithWallet =
    user &&
    walletBalance !== null &&
    selected &&
    walletBalance >= Number(selected.price);
  useEffect(() => {
    let alive = true;
    ordersApi
      .getOrder(id, token)
      .then((r) => {
        if (!alive) return;
        setOrder(r);
        setName(r.customer?.name || "");
        setEmail(r.customer?.email || "");
        rememberOrder(id, token);
        if (isTopUp)
          ordersApi
            .getUsage(id, token)
            .then(setUsage)
            .catch(() => {});
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, token, isTopUp]);
  const baseOriginalId = order?.parentOrderId || order?.orderId;
  const originalProduct = products.find(
    (p) => p.productId === order?.productId,
  );
  const originalFamily = originalProduct?.productFamilyId;
  const candidates = useMemo(() => {
    if (!order) return [];
    return products.filter(
      (p) =>
        p.active &&
        (isTopUp
          ? p.category === "esim_addon" &&
            p.productFamilyId === originalFamily &&
            usage?.rechargeable === true
          : p.category === "esim_replacement" &&
            p.providerId === originalProduct?.providerId),
    );
  }, [products, order, isTopUp, usage, originalFamily, originalProduct]);
  async function submit(e) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    const useWallet = user && paymentMethod === "wallet" && canPayWithWallet;
    try {
      const r = await ordersApi.startCheckout({
        productId: selected.productId,
        productCategory: selected.category,
        customerName: name,
        customerEmail: email,
        existingOrderId: baseOriginalId,
        paymentMethod: useWallet ? "wallet" : "card",
      });
      sessionStorage.setItem("esim_pending_order", r.orderId);
      sessionStorage.setItem("esim_pending_token", r.accessToken);
      rememberOrder(r.orderId, r.accessToken);
      if (r.checkoutUrl) {
        window.location.href = r.checkoutUrl;
      } else {
        window.location.href = `/order-status?local_order=${encodeURIComponent(r.orderId)}&token=${encodeURIComponent(r.accessToken)}`;
      }
    } catch (e) {
      setError(e.message || t("related_purchase.error_checkout"));
      setBusy(false);
    }
  }
  if (loading || productsLoading)
    return (
      <div className="container related-page">
        <Spinner label={t("related_purchase.loading")} />
      </div>
    );
  if (!order)
    return (
      <div className="container related-page">
        <Card>
          <h1>{t("related_purchase.not_found_title")}</h1>
          <p>{error || t("related_purchase.not_found_text")}</p>
          <Link to="/my-esims">
            <Button>{t("my_esims.title")}</Button>
          </Link>
        </Card>
      </div>
    );
  const [sl, st] = statusMeta(order.status);
  return (
    <div className="container related-page">
      <Link
        className="back-link"
        to={`/my-esims/${encodeURIComponent(id)}?token=${encodeURIComponent(token || "")}`}
      >
        <ArrowLeft size={16} /> {t("related_purchase.back_link")}
      </Link>
      <header>
        <span className="eyebrow">
          {isTopUp
            ? t("related_purchase.topup_eyebrow")
            : t("related_purchase.replace_eyebrow")}
        </span>
        <h1>
          {isTopUp
            ? t("related_purchase.topup_title")
            : t("related_purchase.replace_title")}
        </h1>
        <p>
          {isTopUp
            ? t("related_purchase.topup_subtitle")
            : t("related_purchase.replace_subtitle")}
        </p>
      </header>
      {error && <NetworkErrorBanner error={error} />}
      <Card className="related-current">
        <div>
          <strong>{order.productId}</strong>
          <span>Order {order.orderId}</span>
        </div>
        <span>{sl}</span>
        <div className="related-current-facts">
          {getIccid(order) && <span>ICCID {getIccid(order)}</span>}
          {getLpa(order) && (
            <span>{t("related_purchase.credentials_available")}</span>
          )}
        </div>
      </Card>
      <div className="related-layout">
        <section>
          <div className="section-head">
            <h2>
              {isTopUp
                ? t("related_purchase.topup_options_title")
                : t("related_purchase.replace_options_title")}
            </h2>
            <span>
              {t("related_purchase.options_count", { count: candidates.length })}
            </span>
          </div>
          {!candidates.length ? (
            <Card>
              <RefreshCw size={28} />
              <h3>{t("related_purchase.no_options_title")}</h3>
              <p>
                {isTopUp
                  ? t("related_purchase.no_topup_text")
                  : t("related_purchase.no_replace_text")}
              </p>
              <Link to="/">
                <Button variant="secondary">
                  {t("related_purchase.btn_browse_new")}
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="related-products">
              {candidates.map((p) => (
                <button
                  type="button"
                  key={p.productId}
                  className={`related-product${selected?.productId === p.productId ? " selected" : ""}`}
                  onClick={() => setSelected(p)}
                >
                  <div>
                    <strong>{p.title}</strong>
                    <span>{p.providerName}</span>
                    <small>
                      {p.dataLimit} {p.dataUnit || ""} · {p.validityDays} days
                    </small>
                  </div>
                  <div>
                    <strong>${Number(p.price).toFixed(2)}</strong>
                    <Check size={18} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
        <Card className="related-checkout-card">
          <div className="card-section-head">
            <h2>{t("related_purchase.payment_title")}</h2>
            <CreditCard size={18} />
          </div>
          <p className="muted">{t("related_purchase.payment_note")}</p>
          <form onSubmit={submit}>
            <label>
              {t("related_purchase.label_name")}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {t("related_purchase.label_email")}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {selected && (
              <div className="selected-summary">
                <span>{selected.title}</span>
                <strong>${Number(selected.price).toFixed(2)}</strong>
              </div>
            )}
            {user && (
              <div className="related-payment-methods">
                <label
                  className={`related-payment-option${paymentMethod === "card" ? " selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="relatedPaymentMethod"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <CreditCard size={16} /> {t("checkout.pay_with_card")}
                </label>
                <label
                  className={`related-payment-option${paymentMethod === "wallet" ? " selected" : ""}${!canPayWithWallet ? " disabled" : ""}`}
                >
                  <input
                    type="radio"
                    name="relatedPaymentMethod"
                    checked={paymentMethod === "wallet"}
                    disabled={!canPayWithWallet}
                    onChange={() => setPaymentMethod("wallet")}
                  />
                  <Wallet size={16} />
                  {t("checkout.pay_with_wallet")}
                  {walletBalance !== null && (
                    <small>
                      {" "}
                      ({t("checkout.wallet_balance", { amount: walletBalance.toFixed(2) })})
                    </small>
                  )}
                </label>
              </div>
            )}
            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={!selected || busy}
            >
              {busy
                ? t("related_purchase.btn_redirecting")
                : isTopUp
                  ? t("related_purchase.btn_topup_continue")
                  : t("related_purchase.btn_replace_continue")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
