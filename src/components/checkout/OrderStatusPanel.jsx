import { ShieldCheck } from "lucide-react";
import { Spinner } from "../ui/Spinner.jsx";
import { Button } from "../ui/Button.jsx";
import "./OrderStatusPanel.css";

const STATUS_COPY = {
  PendingPayment: { label: "Waiting for card authorization…", tone: "pending" },
  PaymentSetupFailed: {
    label: "Couldn't start the payment. No hold was placed on your card.",
    tone: "error",
  },
  PaymentFailed: {
    label: "Card authorization failed. No charge was made.",
    tone: "error",
  },
  Authorized: {
    label: "Card authorized (not charged yet) — creating your eSIM…",
    tone: "pending",
  },
  Creating: {
    label: "Almost there — provisioning your eSIM…",
    tone: "pending",
  },

  Processing: {
    label: "Identity verification required before your eSIM can activate.",
    tone: "action",
  },
  Completed: {
    label:
      "Payment captured — your eSIM is ready! Check your email for the QR code.",
    tone: "success",
  },
  AuthReleased: {
    label:
      "Activation didn't go through. The hold on your card was released — you were never charged.",
    tone: "error",
  },
  CaptureFailed: {
    label:
      "Your eSIM was created, but we couldn't complete the charge — we'll retry shortly.",
    tone: "error",
  },
  FulfillmentFailedVoidFailed: {
    label:
      "Something went wrong — support has been notified, contact us with your order ID.",
    tone: "error",
  },

  FulfillmentFailedRefundFailed: {
    label:
      "Something went wrong and the refund also failed — support has been notified, contact us with your order ID.",
    tone: "error",
  },
  Cancelled: { label: "This order was cancelled.", tone: "error" },
  Refunded: { label: "This order was refunded.", tone: "error" },
  PollingGaveUp: {
    label:
      "Couldn't confirm this order's status automatically. Check your email, or contact support with your order ID.",
    tone: "error",
  },
};

export function OrderStatusPanel({ orderId, status, kycUrl }) {
  const copy = STATUS_COPY[status] || {
    label: `Status: ${status || "unknown"}`,
    tone: "pending",
  };

  return (
    <div className={`order-status-panel tone-${copy.tone}`}>
      {copy.tone === "pending" && <Spinner />}
      {copy.tone === "action" && <ShieldCheck size={22} />}
      <div>
        <strong>Order {orderId}</strong>
        <p>{copy.label}</p>
        {copy.tone === "action" && kycUrl && (
          <a href={kycUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm">Complete ID verification</Button>
          </a>
        )}
      </div>
    </div>
  );
}
