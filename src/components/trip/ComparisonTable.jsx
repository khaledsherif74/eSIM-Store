import { X } from "lucide-react";
import "./ComparisonTable.css";

export function ComparisonTable({ plans, onRemove }) {
  if (plans.length === 0) return null;

  const rows = [
    { label: "Coverage", render: (p) => `${p.countries.length} countries` },
    { label: "Data", render: (p) => `${p.dataLimit ?? "—"} ${p.dataUnit || ""}` },
    { label: "Validity", render: (p) => `${p.validityDays ?? "—"} days` },
    { label: "Price", render: (p) => `$${p.price.toFixed(2)}` },
    { label: "ID verification", render: (p) => (p.requiresKyc ? "Required" : "Not required") },
  ];

  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th></th>
            {plans.map((p) => (
              <th key={p.productId}>
                <div className="comparison-table-header">
                  <span>{p.title}</span>
                  {onRemove && (
                    <button
                      type="button"
                      className="comparison-table-remove"
                      onClick={() => onRemove(p.productId)}
                      aria-label={`Remove ${p.title} from comparison`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {plans.map((p) => (
                <td key={p.productId}>{row.render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
