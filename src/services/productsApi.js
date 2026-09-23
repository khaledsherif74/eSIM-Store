import { apiClient } from "./apiClient.js";

const FULL_CATALOGUE_LIMIT = 2000;

async function getAllProducts() {
  const data = await apiClient.get(
    `/api/products?limit=${FULL_CATALOGUE_LIMIT}`,
  );
  return data.products || [];
}

async function searchProducts(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all" ||
      value === "any"
    )
      continue;
    if (Array.isArray(value)) {
      if (value.length) query.set(key, value.join(","));
      continue;
    }
    query.set(key, value);
  }
  const qs = query.toString();
  return apiClient.get(`/api/products${qs ? `?${qs}` : ""}`);
}

async function getPopular(limit = 10) {
  return apiClient.get(`/api/products/popular?limit=${limit}`);
}

async function getAddonProducts(orderId, token) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return apiClient.get(
    `/api/products/addons/${encodeURIComponent(orderId)}${query}`,
  );
}

async function getReplacementProducts(orderId, token) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return apiClient.get(
    `/api/products/replacements/${encodeURIComponent(orderId)}${query}`,
  );
}

async function getProductNetworks(productId) {
  return apiClient.get(
    `/api/products/${encodeURIComponent(productId)}/networks`,
  );
}

async function getSyncStatus() {
  return apiClient.get("/api/sync/status");
}

async function checkPrice(productId) {
  return apiClient.post(
    `/api/products/${encodeURIComponent(productId)}/price-check`,
    {},
  );
}

export const productsApi = {
  getAllProducts,
  searchProducts,
  getPopular,
  getAddonProducts,
  getReplacementProducts,
  getProductNetworks,
  getSyncStatus,
  checkPrice,
};
