import "./PlanFilters.css";

export const SORT_OPTIONS = [
  { id: "cheapest", label: "Cheapest" },
  { id: "popular", label: "Popular" },
  { id: "best-value", label: "Best value" },
  { id: "most-data", label: "Most data" },
  { id: "longest-validity", label: "Longest validity" },
  { id: "newest", label: "Newest" },
];

export function PlanFilters({ active, onChange }) {
  return (
    <div className="plan-filters" role="group" aria-label="Sort plans by">
      <span className="plan-filters-label">Sort by</span>
      <div className="plan-filters-chips">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`plan-filter-chip${active === opt.id ? " active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
