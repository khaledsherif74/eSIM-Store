import { useState, useRef, useEffect } from "react";
import { Search, X, Globe2 } from "lucide-react";
import "./DestinationSearch.css";

export function DestinationSearch({
  options,
  onSelect,
  excludeIds = [],
  placeholder = "Search countries or regions…",
  noMatchLabel = "No destinations match",
  regionBadgeLabel = "Region",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pool = options.filter((o) => !excludeIds.includes(o.id));
  const results = query.trim()
    ? pool
        .filter((o) =>
          o.name.toLowerCase().includes(query.trim().toLowerCase()),
        )
        .slice(0, 10)
    : pool.slice(0, 10);

  function handleSelect(option) {
    onSelect(option);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="destination-search" ref={rootRef}>
      <div className="destination-search-input-wrap">
        <Search size={18} className="destination-search-icon" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="destination-search-input"
        />
        {query && (
          <button
            type="button"
            className="destination-search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <ul className="destination-search-results">
          {results.length === 0 ? (
            <li className="destination-search-empty">
              {noMatchLabel} "{query}"
            </li>
          ) : (
            results.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  className="destination-search-option"
                  onClick={() => handleSelect(o)}
                >
                  <span className="destination-search-icon-cell">
                    {o.kind === "region" ? <Globe2 size={16} /> : o.flag}
                  </span>
                  {o.name}
                  {o.kind === "region" && (
                    <span className="destination-search-badge">
                      {regionBadgeLabel}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
