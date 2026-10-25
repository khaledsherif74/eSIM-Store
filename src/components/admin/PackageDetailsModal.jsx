import { useEffect } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "../ui/Badge.jsx";
import { Flag } from "../ui/Flag.jsx";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import { countryName } from "./finance/financeUtils.jsx";
import "./PackageDetailsModal.css";

const CATEGORY_FALLBACK = {
  esim_realtime: "Instant eSIM",
  esim_delayed: "ID verification",
  esim_addon: "Top-up",
  esim_replacement: "Replacement",
};

export function PackageDetailsModal({ pkg, onClose }) {
  const { t } = useTranslation();
  const { language } = useLanguage();

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

  if (!pkg) return null;

  const dataLabel =
    pkg.dataLimit != null
      ? `${pkg.dataLimit} ${pkg.dataUnit || "GB"}`
      : t("common.fallback_dash", "—");
  const validityLabel =
    pkg.validityDays != null
      ? `${pkg.validityDays} ${t("admin.package_details.days", "days")}`
      : t("common.fallback_dash", "—");
  const priceLabel =
    pkg.price != null
      ? `$${Number(pkg.price).toFixed(2)}`
      : t("common.fallback_dash", "—");

  const categoryLabel = pkg.category
    ? t(
        `admin.package_details.category_${pkg.category}`,
        CATEGORY_FALLBACK[pkg.category] || pkg.category,
      )
    : null;

  return (
    <div className="pkg-details-overlay" onClick={onClose}>
      <div
        className="pkg-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pkg-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="pkg-details-close"
          onClick={onClose}
          aria-label={t("common.cancel", "Close")}
        >
          <X size={20} />
        </button>

        <div className="pkg-details-header">
          {pkg.providerLogo ? (
            <img src={pkg.providerLogo} alt="" className="pkg-details-logo" />
          ) : (
            <div className="pkg-details-logo" aria-hidden="true">
              {pkg.providerName?.[0] || pkg.title?.[0] || "?"}
            </div>
          )}
          <div className="pkg-details-header-text">
            <h2 id="pkg-details-title">{pkg.title}</h2>
            {pkg.providerName && (
              <p className="pkg-details-provider">{pkg.providerName}</p>
            )}
            <div className="pkg-details-badges">
              {categoryLabel && <Badge tone="primary">{categoryLabel}</Badge>}
              {pkg.active === false && (
                <Badge tone="warning">
                  {t("admin.package_details.inactive", "Inactive")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="pkg-details-grid">
          <div>
            <span>{t("admin.package_details.data", "Data")}</span>
            <strong>{dataLabel}</strong>
          </div>
          <div>
            <span>{t("admin.package_details.validity", "Validity")}</span>
            <strong>{validityLabel}</strong>
          </div>
          <div>
            <span>{t("admin.package_details.price", "Catalogue price")}</span>
            <strong dir="ltr">{priceLabel}</strong>
          </div>
          <div>
            <span>{t("admin.package_details.orders", "Orders in period")}</span>
            <strong>{pkg.count}</strong>
          </div>
        </div>

        {Array.isArray(pkg.countries) && pkg.countries.length > 0 && (
          <div className="pkg-details-countries">
            <span className="pkg-details-countries-label">
              {t("admin.package_details.countries", {
                count: pkg.countries.length,
                defaultValue: "{{count}} countries",
              })}
            </span>
            <div className="pkg-details-country-list">
              {pkg.countries.map((c) => (
                <span key={c} className="pkg-details-country-chip">
                  <Flag code={c} size={12} />
                  {countryName(c, language) || c}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="pkg-details-id">
          <span>{t("admin.package_details.product_id", "Product ID")}:</span>{" "}
          <code>{pkg.productId}</code>
        </p>
      </div>
    </div>
  );
}
