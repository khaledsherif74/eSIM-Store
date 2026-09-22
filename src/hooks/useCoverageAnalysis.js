import { useMemo } from "react";
import { analyzeTripCoverage } from "../utils/coverageAnalysis.js";

export function useCoverageAnalysis(tripCodes, products) {
  return useMemo(() => analyzeTripCoverage(tripCodes, products), [tripCodes, products]);
}
