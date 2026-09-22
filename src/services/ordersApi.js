import { apiClient } from "./apiClient.js";

function authHeaders(token) {
  return token ? { "X-Order-Token": token } : {};
}

async function startCheckout(payload) {
  return apiClient.post("/api/checkout", payload);
}

async function resolveOrder(token) {
  return apiClient.get(
    `/api/orders/resolve?token=${encodeURIComponent(token || "")}`,
  );
}

async function getOrder(orderId, token) {
  return apiClient.get(
    `/api/orders/${encodeURIComponent(orderId)}${token ? `?token=${encodeURIComponent(token)}` : ""}`,
  );
}

async function confirmPayment(paymobFields) {
  return apiClient.post("/api/payments/confirm", paymobFields);
}

async function refreshOrder(orderId, token) {
  return apiClient.post(
    `/api/orders/${encodeURIComponent(orderId)}/refresh`,
    {},
    { headers: authHeaders(token) },
  );
}

async function getUsage(orderId, token) {
  return apiClient.get(
    `/api/orders/${encodeURIComponent(orderId)}/usage?token=${encodeURIComponent(token || "")}`,
  );
}

async function getRefundEligibility(orderId, token) {
  return apiClient.get(
    `/api/orders/${encodeURIComponent(orderId)}/refund/eligibility?token=${encodeURIComponent(token || "")}`,
  );
}

async function getHistory(orderId, token) {
  return apiClient.get(
    `/api/orders/${encodeURIComponent(orderId)}/history?token=${encodeURIComponent(token || "")}`,
  );
}

export const ordersApi = {
  startCheckout,
  resolveOrder,
  getOrder,
  confirmPayment,
  refreshOrder,
  getUsage,
  getRefundEligibility,
  getHistory,
};
