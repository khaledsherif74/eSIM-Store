import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  SlidersHorizontal,
  X,
  Globe2,
  Search,
  ChevronDown,
} from "lucide-react";
import { DestinationSearch } from "../components/ui/DestinationSearch.jsx";
import { FilterPillGroup } from "../components/ui/FilterPillGroup.jsx";
import { Pagination } from "../components/ui/Pagination.jsx";
import { CountryFilterBar } from "../components/plans/CountryFilterBar.jsx";
import { SORT_OPTIONS } from "../components/plans/PlanFilters.jsx";
import { PlanGrid } from "../components/plans/PlanGrid.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Spinner } from "../components/ui/Spinner.jsx";
import { NetworkErrorBanner } from "../components/ui/NetworkErrorBanner.jsx";
import { NoFullCoverageHelper } from "../components/trip/NoFullCoverageHelper.jsx";
import { PlanDetailsModal } from "../components/plans/PlanDetailsModal.jsx";
import { useCountries } from "../hooks/useCountries.js";
import { useProductSearch } from "../hooks/useProductSearch.js";
import { useProducts } from "../hooks/useProducts.js";
import { useCoverageAnalysis } from "../hooks/useCoverageAnalysis.js";
import { useCurrency, DISPLAY_CURRENCIES } from "../i18n/CurrencyContext.jsx";
import {
  addDestination,
  removeDestination,
  clearTrip,
  selectTripDestinations,
  selectTripCountryCodes,
  selectTripRegionIds,
} from "../store/slices/tripSlice.js";
import "./HomePage.css";
import hero from "../public/images/hero.png";

const SORT_TO_BACKEND = {
  popular: "popular",
  cheapest: "price_asc",
  "best-value": "best_value",
  "most-data": "most_data",
  "longest-validity": "longest_validity",
  newest: "newest",
};

const SORT_LABEL_KEYS = {
  popular: "home.sort_popular",
  cheapest: "home.sort_cheapest",
  "best-value": "home.sort_best_value",
  "most-data": "home.sort_most_data",
  "longest-validity": "home.sort_longest_validity",
  newest: "home.sort_newest",
};

const PAGE_SIZE = 20;

export function HomePage() {
  const [openPlanId, setOpenPlanId] = useState(null);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const {
    countries: masterCountries,
    regions: masterRegions,
    isLoading: destinationsLoading,
  } = useCountries();
  const { countries } = useCountries();
  const destinations = useSelector(selectTripDestinations);
  const countryCodes = useSelector(selectTripCountryCodes);
  const regionIds = useSelector(selectTripRegionIds);

  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState("cheapest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const query = params.get("q") || "";
  const type = params.get("type") || "all";
  const data = (params.get("data") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const calls = params.get("calls") || "any";
  const sms = params.get("sms") || "any";
  const hotspot = params.get("hotspot") || "any";
  const packaging = params.get("packaging") || "all";
  const priceMax = params.get("priceMax") || "all";

  const [queryInput, setQueryInput] = useState(query);
  useEffect(() => {
    setQueryInput(query);
  }, [query]);
  useEffect(() => {
    if (queryInput === query) return;
    const id = setTimeout(() => setFilter("q", queryInput), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [
    countryCodes.join(","),
    regionIds.join(","),
    queryInput,
    type,
    data.join(","),
    calls,
    sms,
    hotspot,
    packaging,
    priceMax,
    sort,
  ]);

  const searchParams = useMemo(
    () => ({
      countries: countryCodes,
      regions: regionIds,
      q: queryInput.trim() || undefined,
      type,
      data,
      calls,
      sms,
      hotspot,
      packaging,
      priceMax,
      sortBy: SORT_TO_BACKEND[sort] || "price_asc",
      page,
      limit: PAGE_SIZE,
    }),
    [
      countryCodes.join(","),
      regionIds.join(","),
      queryInput,
      type,
      data.join(","),
      calls,
      sms,
      hotspot,
      packaging,
      priceMax,
      sort,
      page,
    ],
  );
  const { products, total, totalPages, isLoading, error } =
    useProductSearch(searchParams);

  const needsCoverageFallback =
    !isLoading &&
    total === 0 &&
    countryCodes.length >= 2 &&
    regionIds.length === 0;
  const { products: fullCatalogue, isLoading: catalogueLoading } =
    useProducts();
  const coverage = useCoverageAnalysis(
    needsCoverageFallback ? countryCodes : [],
    fullCatalogue,
  );

  const destinationOptions = useMemo(() => {
    const countryOptions = masterCountries.map((c) => ({
      id: c.code,
      code: c.code,
      name: c.name,
      flag: c.flag,
      kind: "country",
    }));
    const regionOptions = masterRegions.map((r) => ({
      id: r.id,
      name: r.name,
      kind: "region",
    }));
    return [...countryOptions, ...regionOptions].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [masterCountries, masterRegions]);

  function addDest(option) {
    dispatch(addDestination(option));
  }
  function selectCountryFromSlider(code) {
    if (!code) {
      dispatch(clearTrip());
      return;
    }
    const country = masterCountries.find((c) => c.code === code);
    if (country)
      addDest({
        id: country.code,
        code: country.code,
        name: country.name,
        flag: country.flag,
        kind: "country",
      });
  }
  function selectRegionFromSlider(regionId) {
    if (!regionId) return;
    const region = masterRegions.find((r) => r.id === regionId);
    if (region) {
      addDest({
        id: region.id,
        name: region.name,
        kind: "region",
      });
    }
  }

  function goToPage(n) {
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== "all" && value !== "any") next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const hasFilters = !!(
    queryInput ||
    type !== "all" ||
    data.length > 0 ||
    calls !== "any" ||
    sms !== "any" ||
    hotspot !== "any" ||
    packaging !== "all" ||
    priceMax !== "all"
  );

  return (
    <div className="home-page">
      <section
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="home-hero"
      >
        <div className="container home-hero-inner">
          <h1>{t("home.hero_title")}</h1>
          <p>{t("home.hero_subtitle")}</p>

          <div className="home-search-card">
            <span className="home-search-label">{t("home.works_in")}</span>
            <div className="home-search-chips">
              {destinations.map((d) => (
                <span key={d.id} className="home-destination-chip">
                  {d.kind === "region" ? <Globe2 size={14} /> : d.flag}
                  {d.name}
                  <button
                    type="button"
                    onClick={() => dispatch(removeDestination(d.id))}
                    aria-label={`Remove ${d.name}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <div className="home-search-input-cell">
                <DestinationSearch
                  options={destinationOptions}
                  excludeIds={destinations.map((d) => d.id)}
                  onSelect={addDest}
                  placeholder={
                    destinations.length
                      ? t("home.add_destination_placeholder")
                      : t("home.destination_placeholder")
                  }
                  noMatchLabel={t("home.no_destination_match")}
                  regionBadgeLabel={t("home.region_badge")}
                />
              </div>
            </div>
            {destinations.length > 0 && (
              <button
                type="button"
                className="home-search-clear-all"
                onClick={() => dispatch(clearTrip())}
              >
                {t("home.clear_all")}
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="container home-body">
        <CountryFilterBar
          countries={countries}
          regions={masterRegions}
          activeCode={
            destinations.find((d) => d.kind === "country")?.code || null
          }
          activeRegionId={
            destinations.find((d) => d.kind === "region")?.id || null
          }
          onSelect={selectCountryFromSlider}
          onSelectRegion={selectRegionFromSlider}
          onClear={() => dispatch(clearTrip())}
        />

        <div className="home-toolbar">
          <span className="home-results-count">
            <strong>{total}</strong>{" "}
            {t("home.results_count", { count: "" }).trim()}
          </span>
          <div className="home-toolbar-controls">
            <label className="home-toolbar-select">
              <span className="visually-hidden">
                {t("home.currency_label")}
              </span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {DISPLAY_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>

            <button
              type="button"
              className={`home-toolbar-filters-btn${hasFilters ? " has-filters" : ""}`}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={15} /> {t("home.filter_heading")}
            </button>

            <label className="home-toolbar-select">
              <span className="visually-hidden">{t("home.sort_heading")}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {t(SORT_LABEL_KEYS[opt.id] || opt.label)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </div>

        <div className="home-layout">
          <aside className={`home-sidebar${filtersOpen ? " open" : ""}`}>
            <div className="home-sidebar-section">
              <div className="home-sidebar-heading">
                <Search size={15} /> {t("home.search_heading")}
              </div>
              <input
                className="home-text-search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder={t("home.search_plan_placeholder")}
                aria-label={t("home.search_plan_placeholder")}
              />
            </div>

            <div className="home-sidebar-section">
              <div className="home-sidebar-heading">
                <SlidersHorizontal size={15} /> {t("home.filter_heading")}
              </div>
              <FilterPillGroup
                label={t("home.plan_type_label")}
                value={type}
                onChange={(v) => setFilter("type", v)}
                options={[
                  { value: "all", label: t("home.plan_type_all") },
                  { value: "instant", label: t("home.plan_type_instant") },
                  {
                    value: "verification",
                    label: t("home.plan_type_verification"),
                  },
                ]}
              />
              <FilterPillGroup
                label={t("home.data_label")}
                multi
                value={data}
                onChange={(next) => {
                  const nextParams = new URLSearchParams(params);
                  if (next.length) nextParams.set("data", next.join(","));
                  else nextParams.delete("data");
                  setParams(nextParams, { replace: true });
                }}
                options={[
                  { value: "small", label: t("home.data_small") },
                  { value: "medium", label: t("home.data_medium") },
                  { value: "large", label: t("home.data_large") },
                ]}
              />
              <FilterPillGroup
                label={t("home.package_type_label")}
                value={packaging}
                onChange={(v) =>
                  setFilter("packaging", v === packaging ? "all" : v)
                }
                options={[
                  { value: "regional", label: t("home.package_regional") },
                  { value: "global", label: t("home.package_global") },
                ]}
              />
              <FilterPillGroup
                label={t("home.price_label")}
                value={priceMax}
                onChange={(v) => setFilter("priceMax", v)}
                options={[
                  { value: "all", label: t("home.price_all") },
                  { value: "10", label: "$10" },
                  { value: "20", label: "$20" },
                  { value: "30", label: "$30" },
                  { value: "40", label: "$40" },
                  { value: "50", label: "$50" },
                ]}
              />

              <FilterPillGroup
                label={t("home.features_label")}
                multi
                value={[
                  ...(calls === "included" ? ["calls"] : []),
                  ...(sms === "included" ? ["sms"] : []),
                  ...(hotspot === "included" ? ["hotspot"] : []),
                ]}
                onChange={(next) => {
                  const newParams = new URLSearchParams(params);
                  const setOrClear = (key, active) => {
                    if (active) newParams.set(key, "included");
                    else newParams.delete(key);
                  };
                  setOrClear("calls", next.includes("calls"));
                  setOrClear("sms", next.includes("sms"));
                  setOrClear("hotspot", next.includes("hotspot"));
                  setParams(newParams, { replace: true });
                }}
                options={[
                  { value: "calls", label: t("home.calls_included") },
                  { value: "sms", label: t("home.sms_included") },
                  { value: "hotspot", label: t("home.hotspot_included") },
                ]}
              />

              {hasFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  fullWidth
                  onClick={() => setParams({})}
                >
                  {t("home.clear_filters")}
                </Button>
              )}
            </div>
          </aside>

          <div className="home-main">
            {error && <NetworkErrorBanner error={error} />}

            {isLoading || destinationsLoading ? (
              <div className="home-loading">
                <Spinner label="Loading plans…" />
              </div>
            ) : needsCoverageFallback ? (
              catalogueLoading ? (
                <div className="home-loading">
                  <Spinner label="Checking coverage…" />
                </div>
              ) : coverage.status === "full-coverage" ? (
                <PlanGrid
                  plans={coverage.fullCoveragePlans}
                  emptyMessage={t("home.no_results")}
                  onOpenPlan={setOpenPlanId}
                />
              ) : (
                <NoFullCoverageHelper
                  comboPlans={coverage.comboPlans}
                  uncoveredCountries={coverage.uncoveredCountries}
                  onOpenPlan={setOpenPlanId}
                />
              )
            ) : (
              <>
                <PlanGrid
                  plans={products}
                  emptyMessage={t("home.no_results")}
                  onOpenPlan={setOpenPlanId}
                />
                {totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={goToPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {openPlanId && (
        <PlanDetailsModal
          productId={openPlanId}
          onClose={() => setOpenPlanId(null)}
        />
      )}
    </div>
  );
}
