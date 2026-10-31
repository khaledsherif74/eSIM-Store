import { apiClient } from "./apiClient.js";

export const adminApiExtra = {
  listProviders: () => apiClient.get("/api/admin/catalog/providers"),
  lookupProducts: (ids) =>
    apiClient.get(
      `/api/admin/catalog/products?ids=${encodeURIComponent(ids.join(","))}`,
    ),
  listCountries: () => apiClient.get("/api/countries"),
  getSyncSettings: () => apiClient.get("/api/admin/sync/settings"),
  updateSyncSettings: (body) => apiClient.put("/api/admin/sync/settings", body),
  refreshFx: () => apiClient.post("/api/admin/sync/fx/refresh", {}),
  setManualFx: (rate) => apiClient.put("/api/admin/sync/fx", { rate }),
};
