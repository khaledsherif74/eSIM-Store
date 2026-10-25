import { apiClient } from "./apiClient.js";

// Extra admin endpoints (pickers + automatic sync settings).
export const adminApiExtra = {
  listProviders: () => apiClient.get("/api/admin/catalog/providers"),
  lookupProducts: (ids) =>
    apiClient.get(
      `/api/admin/catalog/products?ids=${encodeURIComponent(ids.join(","))}`,
    ),
  listCountries: () => apiClient.get("/api/countries"),
  getSyncSettings: () => apiClient.get("/api/admin/sync/settings"),
  updateSyncSettings: (body) => apiClient.put("/api/admin/sync/settings", body),
};
