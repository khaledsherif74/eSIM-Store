import { useRef } from "react";
import { ChevronLeft, ChevronRight, Globe2 } from "lucide-react";
import "./CountryFilterBar.css";

export function CountryFilterBar({
  countries,
  regions = [],
  activeCode,
  activeRegionId,
  onSelect,
  onSelectRegion,
  onClear,
  maxVisible,
}) {
  const scrollRef = useRef(null);
  const visible = maxVisible ? countries.slice(0, maxVisible) : countries;

  function scrollBy(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="country-filter-bar">
      <button
        type="button"
        className="country-filter-scroll-btn"
        onClick={() => scrollBy(-240)}
        aria-label="Scroll destinations left"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="country-filter-track" ref={scrollRef}>
        {/* All destinations */}
        <button
          type="button"
          className={`country-filter-pill country-filter-all${
            !activeCode && !activeRegionId ? " active" : ""
          }`}
          onClick={() => (onClear ? onClear() : onSelect?.(null))}
          title="All destinations"
          aria-label="Show all destinations"
        >
          <span className="country-filter-pill-circle">
            <span className="country-filter-all-icon">◎</span>
          </span>
          <span className="country-filter-pill-label">All</span>
        </button>

        {/* Regions */}
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            className={`country-filter-pill country-filter-region${
              activeRegionId === region.id ? " active" : ""
            }`}
            onClick={() => onSelectRegion?.(region.id)}
            title={`${region.name}${region.planCount ? ` · ${region.planCount} plans` : ""}`}
            aria-label={`Show eSIM plans for ${region.name}`}
            aria-pressed={activeRegionId === region.id}
          >
            <span className="country-filter-pill-circle">
              {region.imageUrl ? (
                <img
                  src={region.imageUrl}
                  alt=""
                  loading="lazy"
                  width={30}
                  height={20}
                  onError={(e) => {
                    e.currentTarget.replaceWith(
                      document.createTextNode(
                        region.emoji || region.name?.[0] || "•",
                      ),
                    );
                  }}
                />
              ) : region.emoji ? (
                <span className="country-filter-region-emoji">
                  {region.emoji}
                </span>
              ) : (
                <Globe2 size={20} />
              )}
            </span>
            <span className="country-filter-pill-label">{region.name}</span>
          </button>
        ))}

        {/* Countries */}
        {visible.map((country) => (
          <button
            key={country.code}
            type="button"
            className={`country-filter-pill${
              activeCode === country.code ? " active" : ""
            }`}
            onClick={() => onSelect(country.code)}
            title={`${country.name}${
              country.planCount ? ` · ${country.planCount} plans` : ""
            }`}
            aria-label={`Show eSIM plans for ${country.name}`}
            aria-pressed={activeCode === country.code}
          >
            <span className="country-filter-pill-circle">
              {country.flagUrl ? (
                <img
                  src={country.flagUrl}
                  alt=""
                  loading="lazy"
                  width={30}
                  height={20}
                  onError={(e) => {
                    e.currentTarget.replaceWith(
                      document.createTextNode(country.flag || country.code),
                    );
                  }}
                />
              ) : (
                country.flag || country.code
              )}
            </span>
            <span className="country-filter-pill-label">{country.name}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="country-filter-scroll-btn"
        onClick={() => scrollBy(240)}
        aria-label="Scroll destinations right"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
