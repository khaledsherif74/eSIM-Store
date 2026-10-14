import { PlanCard } from "./PlanCard.jsx";
import "./PlanGrid.css";

export function PlanGrid({
  plans,
  tripCodes,
  getBreakdown,
  searchCountries,
  highlightedPlanId,
  onOpenPlan,
  emptyMessage = "No plans match right now.",
}) {
  if (plans.length === 0) {
    return <p className="plan-grid-empty">{emptyMessage}</p>;
  }
  return (
    <div className="plan-grid">
      {plans.map((plan) => (
        <PlanCard
          key={plan.productId}
          plan={plan}
          searchCountries={searchCountries}
          highlight={highlightedPlanId === plan.productId}
          tripBreakdown={
            tripCodes && getBreakdown ? getBreakdown(plan) : undefined
          }
          onOpen={onOpenPlan}
        />
      ))}
    </div>
  );
}
