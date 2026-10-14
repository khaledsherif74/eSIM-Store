import { useMemo } from "react";
import { Check } from "lucide-react";
import "./CountryInfoSection.css";

function toGb(dataLimit, dataUnit) {
  const n = Number(dataLimit);
  if (!n || n <= 0) return null;
  const unit = String(dataUnit || "GB").toUpperCase();
  if (unit === "MB" || unit === "M") return n / 1024;
  if (unit === "TB" || unit === "T") return n * 1024;
  return n;
}

export function CountryInfoSection({ products, onCardClick }) {
  const stats = useMemo(() => {
    if (!products || !products.length) return null;

    const metered = products.filter((p) => {
      if (p.capabilities?.unlimited === true) return false;
      return toGb(p.dataLimit, p.dataUnit) != null && Number(p.price) > 0;
    });

    let bestValuePlan = null;
    let bestValuePerGb = Infinity;
    for (const p of metered) {
      const gb = toGb(p.dataLimit, p.dataUnit);
      const perGb = Number(p.price) / gb;
      if (perGb < bestValuePerGb) {
        bestValuePerGb = perGb;
        bestValuePlan = p;
      }
    }

    const anyUnlimited = products.some(
      (p) => p.capabilities?.unlimited === true,
    );
    let minGb = null;
    let maxGb = null;
    let maxDataPlan = null;
    for (const p of metered) {
      const gb = toGb(p.dataLimit, p.dataUnit);
      if (gb == null) continue;
      if (minGb == null || gb < minGb) minGb = gb;
      if (maxGb == null || gb > maxGb) {
        maxGb = gb;
        maxDataPlan = p;
      }
    }
    if (!maxDataPlan && anyUnlimited) {
      maxDataPlan = products.find((p) => p.capabilities?.unlimited === true);
    }

    const validities = products
      .map((p) => Number(p.validityDays))
      .filter((v) => v > 0);
    const minValidity = validities.length ? Math.min(...validities) : null;
    const maxValidity = validities.length ? Math.max(...validities) : null;
    const maxValidityPlan = maxValidity
      ? products.find((p) => Number(p.validityDays) === maxValidity)
      : null;

    const has5G = products.some((p) => p.capabilities?.fiveG === "included");
    const hasHotspot = products.some(
      (p) => p.capabilities?.hotspot === "included",
    );
    const unlimitedPlans = products.filter(
      (p) => p.capabilities?.unlimited === true,
    );
    let cheapestUnlimited = null;
    let cheapestUnlimitedPrice = Infinity;
    for (const p of unlimitedPlans) {
      const pr = Number(p.price);
      if (pr < cheapestUnlimitedPrice) {
        cheapestUnlimitedPrice = pr;
        cheapestUnlimited = p;
      }
    }

    const featuresTarget =
      products.find((p) => p.capabilities?.fiveG === "included") ||
      products.find((p) => p.capabilities?.hotspot === "included") ||
      cheapestUnlimited ||
      products[0];

    return {
      bestValue: bestValuePlan
        ? {
            plan: bestValuePlan,
            perGb: bestValuePerGb,
            dataLimit: bestValuePlan.dataLimit,
            dataUnit: bestValuePlan.dataUnit || "GB",
            validityDays: bestValuePlan.validityDays,
          }
        : null,
      dataRange: {
        min: minGb,
        max: maxGb,
        maxIsUnlimited: anyUnlimited,
        target: maxDataPlan,
      },
      validityRange: {
        min: minValidity,
        max: maxValidity,
        target: maxValidityPlan,
      },
      features: {
        has5G,
        hasHotspot,
        cheapestUnlimited: cheapestUnlimited
          ? { plan: cheapestUnlimited, price: cheapestUnlimitedPrice }
          : null,
        target: featuresTarget,
      },
    };
  }, [products]);

  if (!stats) return null;

  const dataRangeLabel = (() => {
    const { min, max, maxIsUnlimited } = stats.dataRange;
    if (min == null) return "—";
    if (maxIsUnlimited && max == null) return "Unlimited";
    if (maxIsUnlimited && max != null) return `${min} GB – ∞`;
    if (max != null && max !== min) return `${min} GB – ${max} GB`;
    return `${min} GB`;
  })();

  return (
    <section className="country-info-section">
      <div className="country-info-inner">
        {stats.bestValue && (
          <button
            type="button"
            className="country-info-card"
            onClick={() => onCardClick?.(stats.bestValue.plan.productId)}
          >
            <span className="country-info-label">Best value per GB</span>
            <strong className="country-info-value">
              ${stats.bestValue.perGb.toFixed(2)}
            </strong>
            <span className="country-info-sub">
              {stats.bestValue.dataLimit} {stats.bestValue.dataUnit} ·{" "}
              {stats.bestValue.validityDays} days
            </span>
          </button>
        )}

        <button
          type="button"
          className="country-info-card"
          onClick={() =>
            stats.dataRange.target &&
            onCardClick?.(stats.dataRange.target.productId)
          }
        >
          <span className="country-info-label">Data per plan</span>
          <strong className="country-info-value">{dataRangeLabel}</strong>
        </button>

        <button
          type="button"
          className="country-info-card"
          onClick={() =>
            stats.validityRange.target &&
            onCardClick?.(stats.validityRange.target.productId)
          }
        >
          <span className="country-info-label">Validity</span>
          <strong className="country-info-value">
            {stats.validityRange.min != null
              ? `${stats.validityRange.min}–${stats.validityRange.max} days`
              : "—"}
          </strong>
        </button>

        <button
          type="button"
          className="country-info-card country-info-card-features"
          onClick={() =>
            stats.features.target &&
            onCardClick?.(stats.features.target.productId)
          }
        >
          {stats.features.has5G && (
            <span className="country-info-feature">
              <Check size={14} /> 5G plans
            </span>
          )}
          {stats.features.hasHotspot && (
            <span className="country-info-feature">
              <Check size={14} /> Hotspot
            </span>
          )}
          {stats.features.cheapestUnlimited && (
            <span className="country-info-feature">
              <Check size={14} /> Unlimited from $
              {stats.features.cheapestUnlimited.price.toFixed(2)}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
