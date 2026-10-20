import { apiClient } from "./apiClient.js";

async function validate({ productId, couponCode, customerEmail }) {
  return apiClient.post("/api/coupons/validate", {
    productId,
    ...(couponCode ? { couponCode } : {}),
    ...(customerEmail ? { customerEmail } : {}),
  });
}

export const couponsApi = { validate };
