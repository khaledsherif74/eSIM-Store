import { apiClient } from "./apiClient.js";

async function getCountries() {
  const data = await apiClient.get("/api/countries");
  return { countries: data.countries || [], regions: data.regions || [] };
}

export const countriesApi = { getCountries };
