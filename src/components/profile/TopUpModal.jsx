import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.jsx";
import { apiClient } from "../../services/apiClient.js";
import "./TopUpModal.css";

const PRESET_AMOUNTS = [10, 25, 50, 100];

export function TopUpModal({ onClose }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amount;

  async function handleSubmit() {
    if (!effectiveAmount || effectiveAmount < 1) {
      setError(t("topup_modal.error_min_amount"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { checkoutUrl } = await apiClient.post("/api/wallet/topup", {
        amount: effectiveAmount,
      });
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(err.message || t("topup_modal.error_generic"));
      setSubmitting(false);
    }
  }

  return (
    <div className="topup-modal-overlay" onClick={onClose}>
      <div className="topup-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="topup-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <h2>{t("topup_modal.title")}</h2>
        <p className="topup-modal-subtitle">{t("topup_modal.subtitle")}</p>

        <div className="topup-amount-grid">
          {PRESET_AMOUNTS.map((v) => (
            <button
              key={v}
              type="button"
              className={`topup-amount-pill${!customAmount && amount === v ? " active" : ""}`}
              onClick={() => {
                setAmount(v);
                setCustomAmount("");
              }}
            >
              ${v}
            </button>
          ))}
        </div>

        <label className="topup-custom-label">
          {t("topup_modal.custom_amount_label")}
          <input
            type="number"
            min="1"
            max="10000"
            step="1"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={t("topup_modal.custom_amount_placeholder")}
          />
        </label>

        {error && <div className="topup-error">{error}</div>}

        <Button fullWidth onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? t("topup_modal.btn_redirecting")
            : t("topup_modal.btn_continue", { amount: effectiveAmount || 0 })}
        </Button>
      </div>
    </div>
  );
}
