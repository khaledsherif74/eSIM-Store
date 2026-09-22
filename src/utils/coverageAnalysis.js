function coverageCount(product, tripSet) {
  let n = 0;
  for (const c of product.countries) if (tripSet.has(c)) n++;
  return n;
}

function coversWholeTrip(product, tripCodes) {
  return tripCodes.every((c) => product.countries.includes(c));
}

function greedySetCover(products, tripCodes) {
  const remaining = new Set(tripCodes);
  const combo = [];
  const consideredIds = new Set();

  while (remaining.size > 0) {
    let best = null;
    let bestCovered = 0;

    for (const p of products) {
      if (consideredIds.has(p.productId)) continue;
      const covered = p.countries.filter((c) => remaining.has(c)).length;
      if (covered === 0) continue;
      if (
        covered > bestCovered ||
        (covered === bestCovered && best && p.price < best.price)
      ) {
        best = p;
        bestCovered = covered;
      }
    }

    if (!best) break;

    consideredIds.add(best.productId);
    const coveredCountries = best.countries.filter((c) => remaining.has(c));
    combo.push({ plan: best, coveredCountries });
    coveredCountries.forEach((c) => remaining.delete(c));
  }

  return { combo, stillUncovered: [...remaining] };
}

export function analyzeTripCoverage(tripCodes, products) {
  if (tripCodes.length === 0) {
    return {
      status: "empty",
      fullCoveragePlans: [],
      comboPlans: [],
      coverageMap: {},
      uncoveredCountries: [],
    };
  }

  const tripSet = new Set(tripCodes);

  const fullCoveragePlans = products
    .filter((p) => coversWholeTrip(p, tripCodes))
    .sort((a, b) => a.price - b.price);

  if (fullCoveragePlans.length > 0) {
    const coverageMap = Object.fromEntries(tripCodes.map((c) => [c, "full"]));
    return {
      status: "full-coverage",
      fullCoveragePlans,
      comboPlans: [],
      coverageMap,
      uncoveredCountries: [],
    };
  }

  const candidateProducts = products.filter(
    (p) => coverageCount(p, tripSet) > 0,
  );
  const { combo, stillUncovered } = greedySetCover(
    candidateProducts,
    tripCodes,
  );

  const coverageMap = {};
  for (const code of tripCodes)
    coverageMap[code] = stillUncovered.includes(code) ? "none" : "partial";

  return {
    status: stillUncovered.length > 0 ? "no-coverage" : "combo-needed",
    fullCoveragePlans: [],
    comboPlans: combo,
    coverageMap,
    uncoveredCountries: stillUncovered,
  };
}

export function planTripBreakdown(plan, tripCodes) {
  return tripCodes.map((code) => ({
    code,
    covered: plan.countries.includes(code),
  }));
}

export function valueScore(plan) {
  if (!plan.dataLimit || !plan.validityDays || !plan.price) return Infinity;
  return plan.price / (plan.dataLimit * plan.validityDays);
}
