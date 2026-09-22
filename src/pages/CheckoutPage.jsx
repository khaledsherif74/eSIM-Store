import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useProducts } from "../hooks/useProducts.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { selectProductById } from "../store/slices/productsSlice.js";
import {
  submitCheckout,
  selectCheckout,
} from "../store/slices/checkoutSlice.js";
import { CheckoutForm } from "../components/checkout/CheckoutForm.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { rememberOrder } from "../utils/orderStorage.js";
import "./CheckoutPage.css";

export function CheckoutPage() {
  const { t } = useTranslation();
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading } = useProducts();
  const { user } = useAuth();
  const plan = useSelector((state) => selectProductById(state, productId));
  const { submitting, error } = useSelector(selectCheckout);

  useEffect(() => {
    if (plan) sessionStorage.setItem("esim_pending_product", plan.productId);
  }, [plan]);

  async function handleSubmit({ name, email, paymentMethod }) {
    try {
      const result = await dispatch(
        submitCheckout({
          productId: plan.productId,
          productCategory: plan.category,
          customerName: name,
          customerEmail: email,
          paymentMethod,
        }),
      ).unwrap();

      sessionStorage.setItem("esim_pending_order", result.orderId);
      sessionStorage.setItem("esim_pending_token", result.accessToken);
      rememberOrder(result.orderId, result.accessToken);
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      } else {
        navigate(
          `/order-status?local_order=${encodeURIComponent(result.orderId)}&token=${encodeURIComponent(result.accessToken)}`,
        );
      }
    } catch {
      // Error is already exposed by the Redux checkout slice.
    }
  }

  if (isLoading) {
    return (
      <div className="container checkout-page-loading">
        <Spinner label={t("checkout.loading")} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container checkout-page-notfound">
        <h1>{t("checkout.not_found")}</h1>
        <Link to="/">
          <Button variant="secondary">{t("checkout.browse_plans")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <div className="checkout-page-shell">
        <div>
          <Link className="back-link" to={`/plans/${plan.productId}`}>
            ← {t("checkout.back_to_plan")}
          </Link>
          <h1>{t("checkout.title")}</h1>
          <p className="muted">{t("checkout.subtitle")}</p>

          <Card className="checkout-trust">
            <ShieldCheck size={22} />
            <div>
              <strong>{t("checkout.secure_flow")}</strong>
              <p>{t("checkout.no_card_note")}</p>
            </div>
          </Card>

          <CheckoutForm
            plan={plan}
            submitting={submitting}
            error={error}
            onSubmit={handleSubmit}
            user={user}
          />
        </div>

        <Card className="checkout-summary">
          <span className="eyebrow">{t("checkout.order_summary")}</span>
          <h2>{plan.title}</h2>
          <p>{plan.providerName}</p>
          <div className="checkout-summary-row">
            <span>{t("checkout.data")}</span>
            <strong>
              {plan.dataLimit ?? "—"} {plan.dataUnit || ""}
            </strong>
          </div>
          <div className="checkout-summary-row">
            <span>{t("checkout.validity")}</span>
            <strong>
              {plan.validityDays ?? "—"} {t("plan_details.days")}
            </strong>
          </div>
          <div className="checkout-summary-row">
            <span>{t("checkout.activation")}</span>
            <strong>
              {plan.requiresKyc
                ? t("checkout.id_verification")
                : t("checkout.instant")}
            </strong>
          </div>
          <div className="checkout-summary-row">
            <span>{t("checkout.catalogue_price")}</span>
            <strong>
              {Number(plan.price).toFixed(2)} {plan.currency}
            </strong>
          </div>
          <p className="muted checkout-summary-note">
            {t("checkout.egp_note")}
          </p>
        </Card>
      </div>
    </div>
  );
}
