import { useEffect } from "react";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { selectProductById } from "../../store/slices/productsSlice.js";
import { useProducts } from "../../hooks/useProducts.js";
import { Spinner } from "../ui/Spinner.jsx";
import { PlanDetailsContent } from "./PlanDetailsContent.jsx";
import "./PlanDetailsModal.css";

export function PlanDetailsModal({ productId, onClose }) {
  const { isLoading } = useProducts();
  const plan = useSelector((s) => selectProductById(s, productId));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="plan-details-modal-overlay" onClick={onClose}>
      <div
        className="plan-details-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="plan-details-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {isLoading || !plan ? (
          <div className="plan-details-modal-loading">
            <Spinner label="Loading plan…" />
          </div>
        ) : (
          <PlanDetailsContent plan={plan} onBack={onClose} />
        )}
      </div>
    </div>
  );
}
