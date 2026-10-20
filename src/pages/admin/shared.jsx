import { Button } from "../../components/ui/Button.jsx";

export const STATUS_OPTIONS = [
  "",
  "PendingPayment",
  "Authorized",
  "Creating",
  "Processing",
  "Completed",
  "PaymentFailed",
  "CaptureFailed",
  "FulfillmentFailedVoidFailed",
  "FulfillmentFailedRefundFailed",
  "Cancelled",
  "Refunded",
];



export const SECRET_LABELS = {
  MARKUP_PERCENT: "Markup Percent",
  REFERRAL_REWARD: "Referral Reward Amount",
  SYNC_INTERVAL_MINUTES: "Sync Interval (Minutes)",
  SYNC_ON_STARTUP: "Sync On Startup",
  MAX_DEACTIVATION_RATIO: "Max Deactivation Ratio",
  EXCHANGE_RATE_USD_TO_EGP: "Exchange Rate (USD to EGP)",
  MOBIMATTER_BASE_URL: "MobiMatter Base URL",
  MOBIMATTER_API_KEY: "MobiMatter API Key",
  MOBIMATTER_MERCHANT_ID: "MobiMatter Merchant ID",
  PAYMOB_API_KEY: "Paymob API Key",
  PAYMOB_INTEGRATION_ID: "Paymob Integration ID",
  PAYMOB_IFRAME_ID: "Paymob Iframe ID",
  PAYMOB_HMAC_SECRET: "Paymob HMAC Secret",
  PAYMOB_PUBLIC_KEY: "Paymob Public Key",
  PAYMOB_SECRET_KEY: "Paymob Secret Key",
  SMTP_HOST: "SMTP Host",
  SMTP_PORT: "SMTP Port",
  SMTP_USER: "SMTP User",
  SMTP_PASS: "SMTP Password",
  ADMIN_USERNAME: "Admin Username",
};

export const SECRET_PLACEHOLDERS = {
  MARKUP_PERCENT: "e.g. 15",
  SYNC_INTERVAL_MINUTES: "e.g. 60",
  SYNC_ON_STARTUP: "true / false",
  MAX_DEACTIVATION_RATIO: "e.g. 0.1",
  EXCHANGE_RATE_USD_TO_EGP: "e.g. 48.50",
  MOBIMATTER_BASE_URL: "https://api.mobimatter.com",
  MOBIMATTER_API_KEY: "Your API Key",
  MOBIMATTER_MERCHANT_ID: "Your Merchant ID",
  PAYMOB_API_KEY: "Your Paymob API Key",
  PAYMOB_INTEGRATION_ID: "Your Integration ID",
  PAYMOB_IFRAME_ID: "Your Iframe ID",
  PAYMOB_HMAC_SECRET: "Your HMAC Secret",
  PAYMOB_PUBLIC_KEY: "Your Public Key",
  PAYMOB_SECRET_KEY: "Your Secret Key",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "email@example.com",
  SMTP_PASS: "Your App Password",
  ADMIN_USERNAME: "Admin Username",
};

export function growthPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const SERVICE_LABELS = {
  database: "Database",
  smtp: "SMTP",
  paymob: "Paymob",
  mobimatter: "MobiMatter",
};


export function SecretRow({
  t,
  label,
  value,
  editing,
  editingValue,
  inputType = "text",
  placeholder,
  onEdit,
  onChange,
  onCancel,
  onSave,
  saving,
}) {
  const effectivePlaceholder =
    placeholder || SECRET_PLACEHOLDERS[label] || value || "";
  return (
    <div className="secret-item">
      <span className="secret-key">{SECRET_LABELS[label] || label}</span>
      {editing ? (
        <div className="secret-edit-input">
          <input
            type={inputType}
            value={editingValue}
            placeholder={effectivePlaceholder}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="secret-actions">
            <Button
              size="sm"
              variant="primary"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? t("admin.saving") : t("admin.save")}
            </Button>
            <Button size="sm" variant="secondary" onClick={onCancel}>
              {t("admin.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="secret-value-box">
          <span className="masked-val">{value}</span>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            {t("admin.edit")}
          </Button>
        </div>
      )}
    </div>
  );
}
