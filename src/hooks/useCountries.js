import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCountries,
  selectAllCountries,
  selectAllRegions,
  selectCountriesStatus,
  selectCountriesError,
} from "../store/slices/countriesSlice.js";
import { flagEmoji } from "../utils/countries.js";

export function useCountries() {
  const dispatch = useDispatch();
  const rawCountries = useSelector(selectAllCountries);
  const regions = useSelector(selectAllRegions);
  const status = useSelector(selectCountriesStatus);
  const error = useSelector(selectCountriesError);

  useEffect(() => {
    if (status === "idle") dispatch(fetchCountries());
  }, [status, dispatch]);

  const countries = useMemo(
    () => rawCountries.map((c) => ({ ...c, flag: flagEmoji(c.code) })),
    [rawCountries],
  );

  return {
    countries,
    regions,
    isLoading: status === "loading" || status === "idle",
    error,
  };
}
