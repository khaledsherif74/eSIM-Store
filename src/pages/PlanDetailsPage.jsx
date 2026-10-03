import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProducts } from "../hooks/useProducts.js";
import { selectProductById } from "../store/slices/productsSlice.js";
import { Button } from "../components/ui/Button.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { PlanDetailsContent } from "../components/plans/PlanDetailsContent.jsx";
import "./PlanDetailsPage.css";

export function PlanDetailsPage() {
  const { t } = useTranslation();
  const { productId } = useParams();
  const { isLoading } = useProducts();
  const plan = useSelector((s) => selectProductById(s, productId));

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

  return (
    <div className="container plan-details-page">
      <PlanDetailsContent plan={plan} />
    </div>
  );
}
