import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CountryFilterBar.css";

export function CountryFilterBar({
  countries,
  activeCode,
  onSelect,
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
        <button
          type="button"
          className={`country-filter-pill country-filter-all${!activeCode ? " active" : ""}`}
          onClick={() => onSelect(null)}
          title="All destinations"
          aria-label="Show all destinations"
        >
          <span className="country-filter-all-icon">◎</span>
          <span className="country-filter-pill-label">All</span>
        </button>

        {visible.map((country) => (
          <button
            key={country.code}
            type="button"
            className={`country-filter-pill${activeCode === country.code ? " active" : ""}`}
            onClick={() => onSelect(country.code)}
            title={`${country.name}${country.planCount ? ` · ${country.planCount} plans` : ""}`}
            aria-label={`Show eSIM plans for ${country.name}`}
            aria-pressed={activeCode === country.code}
          >
            <span className="country-filter-flag">
              {country.flagUrl ? (
                <img
                  src={country.flagUrl}
                  alt=""
                  loading="lazy"
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
