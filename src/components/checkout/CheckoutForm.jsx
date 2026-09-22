import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.jsx";
import { walletApi } from "../../services/walletApi.js";
import "./CheckoutForm.css";

export function CheckoutForm({ plan, submitting, error, onSubmit, user }) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [walletBalance, setWalletBalance] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");

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
    user && walletBalance !== null && walletBalance >= Number(plan.price);

  function handleSubmit(e) {
    e.preventDefault();
    const identity = user
      ? { name: user.name || "", email: user.email }
      : { name, email };
    onSubmit({ ...identity, paymentMethod: user ? paymentMethod : "card" });
  }

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-form-summary">
        <span className="checkout-form-plan-title">{plan.title}</span>
        <span className="checkout-form-plan-price">
          ${plan.price.toFixed(2)} <small>{plan.currency}</small>
        </span>
      </div>

      {user ? (
        <p className="checkout-form-account-note">
          {t("checkout.buying_as")} <strong>{user.name || user.email}</strong> (
          {user.email})
        </p>
      ) : (
        <>
          <label className="checkout-form-label">
            {t("checkout.full_name")}
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="checkout-form-label">
            {t("checkout.email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </>
      )}

      {user && (
        <div className="checkout-form-payment-methods">
          <label
            className={`checkout-payment-option${paymentMethod === "card" ? " selected" : ""}`}
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
            className={`checkout-payment-option${paymentMethod === "wallet" ? " selected" : ""}${!canPayWithWallet ? " disabled" : ""}`}
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
