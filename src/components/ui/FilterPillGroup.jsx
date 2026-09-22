import "./FilterPillGroup.css";

export function FilterPillGroup({
  label,
  options,
  value,
  onChange,
  multi = false,
}) {
  const isActive = (optValue) =>
    multi ? value.includes(optValue) : value === optValue;

  function handleClick(optValue) {
    if (!multi) {
      onChange(optValue);
      return;
    }
    onChange(
      value.includes(optValue)
        ? value.filter((v) => v !== optValue)
        : [...value, optValue],
    );
  }

  return (
    <div className="filter-pill-group">
      {label && <span className="filter-pill-label">{label}</span>}
      <div className="filter-pills">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`filter-pill${isActive(opt.value) ? " active" : ""}`}
            aria-pressed={isActive(opt.value)}
            onClick={() => handleClick(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
