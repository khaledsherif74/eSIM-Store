import { apiClient } from "./apiClient.js";

async function validate({ productId, couponCode, customerEmail }) {
  return apiClient.post("/api/coupons/validate", {
    productId,
    ...(couponCode ? { couponCode } : {}),
    ...(customerEmail ? { customerEmail } : {}),
  });
}

// Coupons the store chose to show customers for this plan.
async function available(productId) {
  return apiClient.get(
    `/api/coupons/available?productId=${encodeURIComponent(productId)}`,
  );
}

export const couponsApi = { validate, available };
