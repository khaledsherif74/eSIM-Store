import { apiClient } from "./apiClient.js";

async function getBalance() {
  return apiClient.get("/api/wallet/balance");
}

export const walletApi = {
  getBalance,
};
