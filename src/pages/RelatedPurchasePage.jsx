import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, CreditCard, RefreshCw, ArrowLeft, Wallet } from "lucide-react";

import { ordersApi } from "../services/ordersApi.js";
import { productsApi } from "../services/productsApi.js";
import { walletApi } from "../services/walletApi.js";
import { useAuth } from "../hooks/useAuth.jsx";

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
  const token = params.get("token") || getOrderAccess(id)?.token || "";

  const isTopUp = mode === "topup";
  const isReplacement = mode === "replace";

  const [order, setOrder] = useState(null);
  const [usage, setUsage] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [selected, setSelected] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [error, setError] = useState(null);

  /*
   * Load wallet balance for logged-in users.
   */
  useEffect(() => {
    if (!user) return;

    let alive = true;

    walletApi
      .getBalance()
      .then((result) => {
        if (!alive) return;

        setWalletBalance(Number(result.balance));
      })
      .catch(() => {
        if (!alive) return;

        setWalletBalance(null);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  const canPayWithWallet =
    user &&
    walletBalance !== null &&
    selected &&
    walletBalance >= Number(selected.price);

  /*
   * Load the original order.
   */
  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Order ID is missing.");
      return;
    }

    let alive = true;

    setLoading(true);
    setError(null);

    ordersApi
      .getOrder(id, token)
      .then((result) => {
        if (!alive) return;

        setOrder(result);

        setName(result.customer?.name || "");
        setEmail(result.customer?.email || "");

        rememberOrder(id, token);

        /*
         * Top Up needs usage information to know whether
         * the existing eSIM is rechargeable.
         */
        if (isTopUp) {
          ordersApi
            .getUsage(id, token)
            .then((usageResult) => {
              if (!alive) return;

              setUsage(usageResult);
            })
            .catch(() => {
              if (!alive) return;

              setUsage(null);
            });
        }
      })
      .catch((e) => {
        if (!alive) return;

        setError(e.message || "Failed to load order.");
      })
      .finally(() => {
        if (!alive) return;

        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, token, isTopUp]);

  /*
   * Load related products from the dedicated backend endpoint.
   *
   * Top Up:
   *   GET /api/products/addons/:orderId
   *
   * Replacement:
   *   GET /api/products/replacements/:orderId
   */
  useEffect(() => {
    if (!order) return;
    if (!isTopUp && !isReplacement) return;

    let alive = true;

    setProducts([]);
    setSelected(null);
    setProductsLoading(true);

    const request = isTopUp
      ? productsApi.getAddonProducts(id, token)
      : productsApi.getReplacementProducts(id, token);

    request
      .then((result) => {
        if (!alive) return;

        setProducts(result.products || []);
      })
      .catch((e) => {
        if (!alive) return;

        setProducts([]);

        setError(
          e.message ||
            (isTopUp
              ? "Failed to load top-up options."
              : "Failed to load replacement options."),
        );
      })
      .finally(() => {
        if (!alive) return;

        setProductsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [order, isTopUp, isReplacement, id, token]);

  /*
   * Top Up products are already filtered by the backend.
   *
   * We only check the current eSIM's rechargeable status.
   *
   * Replacement products are also already filtered by the
   * backend for the current order.
   */
  const candidates = isTopUp
    ? usage?.rechargeable === true
      ? products.filter((product) => product.active)
      : []
    : products.filter((product) => product.active);

  /*
   * Start checkout.
   */
  async function submit(e) {
    e.preventDefault();

    if (!selected) return;

    setBusy(true);
    setError(null);

    const useWallet = user && paymentMethod === "wallet" && canPayWithWallet;

    try {
      const result = await ordersApi.startCheckout({
        productId: selected.productId,
        productCategory: selected.category,
        customerName: name,
        customerEmail: email,

        /*
         * The related purchase must reference the
         * original order.
         */
        existingOrderId: order?.parentOrderId || order?.orderId,

        paymentMethod: useWallet ? "wallet" : "card",
      });

      sessionStorage.setItem("esim_pending_order", result.orderId);

      sessionStorage.setItem("esim_pending_token", result.accessToken);

      rememberOrder(result.orderId, result.accessToken);

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        window.location.href = `/order-status?local_order=${encodeURIComponent(
          result.orderId,
        )}&token=${encodeURIComponent(result.accessToken)}`;
      }
    } catch (e) {
      setError(e.message || t("related_purchase.error_checkout"));

      setBusy(false);
    }
  }

  /*
   * Initial loading.
   */
  if (loading || productsLoading) {
    return (
      <div className="container related-page">
        <Spinner label={t("related_purchase.loading")} />
      </div>
    );
  }

  /*
   * Order could not be loaded.
   */
  if (!order) {
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
  }

  const [statusLabel] = statusMeta(order.status);

  return (
    <div className="container related-page">
      <Link
        className="back-link"
        to={`/my-esims/${encodeURIComponent(id)}?token=${encodeURIComponent(
          token || "",
        )}`}
      >
        <ArrowLeft size={16} />

        {t("related_purchase.back_link")}
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

        <span>{statusLabel}</span>

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
              {t("related_purchase.options_count", {
                count: candidates.length,
              })}
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
              {candidates.map((product) => {
                const tags = Array.isArray(product.tags) ? product.tags : [];

                return (
                  <button
                    type="button"
                    key={product.productId}
                    className={`related-product${
                      selected?.productId === product.productId
                        ? " selected"
                        : ""
                    }`}
                    onClick={() => setSelected(product)}
                  >
                    <div>
                      <strong>{product.title}</strong>

                      <span>{product.providerName}</span>

                      {tags.length > 0 && (
                        <div className="related-product-tags">
                          {tags.map((tag, index) => (
                            <span
                              key={`${tag.item}-${index}`}
                              className="related-product-tag"
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

                      <small>
                        {product.dataLimit} {product.dataUnit || ""} ·{" "}
                        {product.validityDays} days
                      </small>
                    </div>

                    <div>
                      <strong>${Number(product.price).toFixed(2)}</strong>

                      <Check size={18} />
                    </div>
                  </button>
                );
              })}
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
                  className={`related-payment-option${
                    paymentMethod === "card" ? " selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="relatedPaymentMethod"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />

                  <CreditCard size={16} />

                  {t("checkout.pay_with_card")}
                </label>

                <label
                  className={`related-payment-option${
                    paymentMethod === "wallet" ? " selected" : ""
                  }${!canPayWithWallet ? " disabled" : ""}`}
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
                      (
                      {t("checkout.wallet_balance", {
                        amount: walletBalance.toFixed(2),
                      })}
                      )
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
