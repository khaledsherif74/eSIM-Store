import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.jsx";
import { walletApi } from "../../services/walletApi.js";
import { couponsApi } from "../../services/couponsApi.js";
import "./CheckoutForm.css";

export function CheckoutForm({ plan, submitting, error, onSubmit, user }) {
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [offerQuote, setOfferQuote] = useState(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedQuote, setAppliedQuote] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!name && user.name) setName(user.name);
    if (!email && user.email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    let alive = true;
    couponsApi
      .validate({ productId: plan.productId })
      .then((q) => alive && setOfferQuote(q))
      .catch(() => alive && setOfferQuote(null));
    return () => {
      alive = false;
    };
  }, [plan.productId]);

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

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg("");
    try {
      const q = await couponsApi.validate({
        productId: plan.productId,
        couponCode: code,
        customerEmail: email || user?.email,
      });
      if (q.valid) setAppliedQuote(q);
      else setCouponMsg(q.message || t("checkout.coupon_invalid"));
    } catch (err) {
      setCouponMsg(err.message || t("checkout.coupon_invalid"));
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setAppliedQuote(null);
    setCouponInput("");
    setCouponMsg("");
  }

  const quote =
    appliedQuote ||
    (offerQuote && offerQuote.totalDiscount > 0 ? offerQuote : null);

  const canPayWithWallet =
    user && walletBalance !== null && walletBalance >= Number(plan.price);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      paymentMethod: user ? paymentMethod : "card",
      couponCode: appliedQuote ? appliedQuote.code : undefined,
    });
  }

  const needsNameInput = !user?.name;
  const needsEmailInput = true;

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form-summary">
        <span className="checkout-form-plan-title">{plan.title}</span>
        <span className="checkout-form-plan-price">
          ${Number(plan.price).toFixed(2)} <small>{plan.currency}</small>
        </span>
      </div>

      <div className="checkout-coupon">
        {appliedQuote ? (
          <div className="checkout-coupon-applied">
            <span>
              {t("checkout.coupon_applied", { code: appliedQuote.code })}
            </span>
            <button
              type="button"
              className="checkout-coupon-remove"
              onClick={removeCoupon}
            >
              {t("checkout.coupon_remove")}
            </button>
          </div>
        ) : (
          <div className="checkout-coupon-row">
            <input
              type="text"
              dir="ltr"
              value={couponInput}
              maxLength={32}
              placeholder={t("checkout.coupon_placeholder")}
              aria-label={t("checkout.coupon_label")}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyCoupon();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={applyCoupon}
              disabled={couponBusy || !couponInput.trim()}
            >
              {t("checkout.coupon_apply")}
            </Button>
          </div>
        )}
        {couponMsg && (
          <p className="checkout-coupon-error" role="alert">
            {couponMsg}
          </p>
        )}
        {quote && (
          <div className="checkout-coupon-quote" aria-live="polite">
            {quote.offer && quote.offer.discount > 0 && (
              <span>
                <b className="checkout-offer-badge">{quote.offer.name}</b> −E£
                {quote.offer.discount}
              </span>
            )}
            {quote.couponDiscount > 0 && (
              <span>
                {t("checkout.coupon_discount")} −E£{quote.couponDiscount}
              </span>
            )}
            <strong>
              {t("checkout.you_pay", { amount: quote.finalPrice })}
            </strong>
          </div>
        )}
      </div>

      {user && (
        <p className="checkout-form-account-note">
          {t("checkout.buying_as")}{" "}
          <strong>{user.name || user.email || "Signed-in user"}</strong>
        </p>
      )}

      {needsNameInput && (
        <label className="checkout-form-label">
          {t("checkout.full_name")}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            maxLength={100}
          />
        </label>
      )}

      {needsEmailInput && (
        <label className="checkout-form-label">
          {t("checkout.email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            maxLength={254}
          />
        </label>
      )}

      {user && (
        <div className="checkout-form-payment-methods">
          <label
            className={`checkout-payment-option${
              paymentMethod === "card" ? " selected" : ""
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === "card"}
              onChange={() => setPaymentMethod("card")}
            />
            {t("checkout.pay_with_card")}
          </label>
          <label
            className={`checkout-payment-option${
              paymentMethod === "wallet" ? " selected" : ""
            }${!canPayWithWallet ? " disabled" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="wallet"
              checked={paymentMethod === "wallet"}
              disabled={!canPayWithWallet}
              onChange={() => setPaymentMethod("wallet")}
            />
            <span>
              {t("checkout.pay_with_wallet")}
              {walletBalance !== null && (
                <small className="checkout-payment-balance">
                  {" "}
                  (
                  {t("checkout.wallet_balance", {
                    amount: walletBalance.toFixed(2),
                  })}
                  )
                </small>
              )}
            </span>
          </label>
          {!canPayWithWallet && walletBalance !== null && (
            <p className="checkout-form-wallet-note">
              {t("checkout.wallet_insufficient")}
            </p>
          )}
        </div>
      )}

      {error && <p className="checkout-form-error">{error}</p>}

      <Button type="submit" fullWidth disabled={submitting}>
        {submitting
          ? t("checkout.redirecting")
          : t("checkout.continue_to_payment")}
      </Button>
      <p className="checkout-form-note">
        {paymentMethod === "wallet"
          ? t("checkout.wallet_note")
          : t("checkout.paymob_note")}
      </p>
    </form>
  );
}
