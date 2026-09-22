function lineItemDetails(order) {
  return (
    order?.raw?.orderLineItem?.lineItemDetails ||
    order?.raw?.lineItemDetails ||
    []
  );
}

function detail(order, name) {
  const entry = lineItemDetails(order).find((d) => d?.name === name);
  return entry ? entry.value : null;
}

export function getQrValue(order) {
  return detail(order, "QR_CODE");
}

export function getLpa(order) {
  return detail(order, "LPA") || detail(order, "LOCAL_PROFILE_ASSISTANT");
}

export function getSmdp(order) {
  return detail(order, "SMDP_ADDRESS");
}

export function getActivationCode(order) {
  return detail(order, "ACTIVATION_CODE");
}

export function getIccid(order) {
  return detail(order, "ICCID");
}

export function getApn(order) {
  return detail(order, "ACCESS_POINT_NAME") || detail(order, "APN");
}

export function getPhoneNumber(order) {
  return detail(order, "PHONE_NUMBER") || detail(order, "MSISDN");
}

export function getKycUrl(order) {
  return order?.kycUrl || detail(order, "KYC_URL");
}

export function getOneClickInstall(order) {
  const oneClick = order?.raw?.orderLineItem?.oneClickInstall;
  if (oneClick?.ios || oneClick?.android) {
    return { ios: oneClick.ios || null, android: oneClick.android || null };
  }
  const lpa = getLpa(order);
  if (!lpa) return null;
  return {
    ios: `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`,
    android: null,
  };
}

export function isRechargeable(order) {
  const value = detail(order, "RECHARGABLE");
  return value === "true" || value === true;
}

const STATUS_META = {
  PendingPayment: ["Waiting for payment", "warning"],
  PaymentSetupFailed: ["Payment setup failed", "danger"],
  PaymentFailed: ["Payment failed", "danger"],
  Authorized: ["Payment authorized", "primary"],
  Creating: ["Creating your eSIM", "primary"],
  Processing: ["Verification in progress", "warning"],
  Completed: ["Active", "success"],
  AuthReleased: ["Payment released", "neutral"],
  CaptureFailed: ["Payment capture failed", "danger"],
  FulfillmentFailedVoidFailed: ["Fulfillment failed", "danger"],
  FulfillmentFailedRefundFailed: ["Fulfillment failed", "danger"],
  Cancelled: ["Cancelled", "neutral"],
  Refunded: ["Refunded", "neutral"],
  Created: ["Created", "neutral"],
};

export function statusMeta(status) {
  return STATUS_META[status] || [status || "Unknown", "neutral"];
}

export function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}
