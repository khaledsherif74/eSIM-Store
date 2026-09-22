import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

function pageList(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = pageList(page, totalPages);

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="pagination-arrow"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) => (
        <span key={p} className="pagination-item">
          {i > 0 && p - pages[i - 1] > 1 && (
            <span className="pagination-ellipsis">…</span>
          )}
          <button
            type="button"
            className={`pagination-page${p === page ? " active" : ""}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        </span>
      ))}

      <button
        type="button"
        className="pagination-arrow"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
