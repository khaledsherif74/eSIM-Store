import { apiClient, ApiError } from "./apiClient.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function downloadCsv(path, params, filename) {
  const res = await fetch(`${BASE_URL}${path}${qs(params)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error || `Request failed (${res.status})`, {
      status: res.status,
      body,
    });
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function qs(obj = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  login: (username, password) =>
    apiClient.post("/api/admin/login", { username, password }),
  logout: () => apiClient.post("/api/admin/logout", {}),
  session: () => apiClient.get("/api/admin/session"),
  forgotPassword: (email) =>
    apiClient.post("/api/admin/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    apiClient.post("/api/admin/reset-password", { token, newPassword }),
  listOrders: ({ page = 1, pageSize = 25, status = "" } = {}) => {
    const params = new URLSearchParams({
      page,
      pageSize,
      ...(status ? { status } : {}),
    });
    return apiClient.get(`/api/admin/orders?${params}`);
  },
  getOrder: (orderId) =>
    apiClient.get(`/api/admin/orders/${encodeURIComponent(orderId)}`),
  triggerSync: () => apiClient.post("/api/admin/sync", {}),
  syncStatus: () => apiClient.get("/api/admin/sync/status"),
  getStats: () => apiClient.get("/api/admin/stats"),
  getSettings: () => apiClient.get("/api/admin/settings"),
  updateSettings: (settings) => apiClient.put("/api/admin/settings", settings),
  getSecrets: () => apiClient.get("/api/admin/secrets"),
  updateSecret: (key, value) =>
    apiClient.put("/api/admin/secrets", { key, value }),
  getOverview: () => apiClient.get("/api/admin/overview"),

  listCustomers: (params) => apiClient.get(`/api/admin/customers${qs(params)}`),
  downloadCustomersCsv: (params) =>
    downloadCsv("/api/admin/customers/export.csv", params, "customers.csv"),
  getCustomer: (id) =>
    apiClient.get(`/api/admin/customers/${encodeURIComponent(id)}`),
  setCustomerBlocked: (id, body) =>
    apiClient.patch(`/api/admin/customers/${encodeURIComponent(id)}`, body),
  addCustomerNote: (id, note) =>
    apiClient.post(`/api/admin/customers/${encodeURIComponent(id)}/notes`, {
      note,
    }),
  anonymizeCustomer: (id) =>
    apiClient.post(`/api/admin/customers/${encodeURIComponent(id)}/anonymize`, {
      confirm: true,
    }),

  refreshOrder: (orderId) =>
    apiClient.post(
      `/api/admin/orders/${encodeURIComponent(orderId)}/refresh`,
      {},
    ),
  resendOrderEmail: (orderId) =>
    apiClient.post(
      `/api/admin/orders/${encodeURIComponent(orderId)}/resend-email`,
      {},
    ),
  revealOrderAccessToken: (orderId) =>
    apiClient.post(
      `/api/admin/orders/${encodeURIComponent(orderId)}/access-token`,
      {},
    ),
  resendOrderAccessEmail: (orderId) =>
    apiClient.post(
      `/api/admin/orders/${encodeURIComponent(orderId)}/resend-access-email`,
      {},
    ),
  listPayments: (params) => apiClient.get(`/api/admin/payments${qs(params)}`),
  listEmails: (params) => apiClient.get(`/api/admin/emails${qs(params)}`),
  resendEmail: (id) =>
    apiClient.post(`/api/admin/emails/${encodeURIComponent(id)}/resend`, {}),
  getSecurity: () => apiClient.get("/api/admin/security"),
  revokeAdminSession: (id) =>
    apiClient.post(
      `/api/admin/security/sessions/${encodeURIComponent(id)}/revoke`,
      {},
    ),
  getSiteSettings: () => apiClient.get("/api/admin/site-settings"),
  updateSiteSettings: (body) => apiClient.put("/api/admin/site-settings", body),
  downloadOrdersReport: (params) =>
    downloadCsv("/api/admin/reports/orders.csv", params, "orders-report.csv"),
  downloadSalesReport: (params) =>
    downloadCsv("/api/admin/reports/sales.csv", params, "sales-report.csv"),
  listAuditLog: (params) => apiClient.get(`/api/admin/logs/audit${qs(params)}`),

  listReferrals: (params) => apiClient.get(`/api/admin/referrals${qs(params)}`),
  approveReferral: (id) =>
    apiClient.post(
      `/api/admin/referrals/${encodeURIComponent(id)}/approve`,
      {},
    ),
  rejectReferral: (id, reason) =>
    apiClient.post(`/api/admin/referrals/${encodeURIComponent(id)}/reject`, {
      reason,
    }),
  revokeReferral: (id, reason) =>
    apiClient.post(`/api/admin/referrals/${encodeURIComponent(id)}/revoke`, {
      reason,
    }),
  getReferralSettings: () => apiClient.get("/api/admin/referrals/settings"),
  updateReferralSettings: (body) =>
    apiClient.put("/api/admin/referrals/settings", body),
  runRewardExpiry: () => apiClient.post("/api/admin/referrals/expire-run", {}),
  getLedger: (params) => apiClient.get(`/api/admin/ledger${qs(params)}`),
  searchWalletCustomers: (q) =>
    apiClient.get(`/api/admin/wallet/customers${qs({ q })}`),
  adjustWallet: (body) => apiClient.post("/api/admin/wallet/adjust", body),

  listCoupons: () => apiClient.get("/api/admin/coupons"),
  createCoupon: (body) => apiClient.post("/api/admin/coupons", body),
  updateCoupon: (id, body) =>
    apiClient.patch(`/api/admin/coupons/${encodeURIComponent(id)}`, body),
  getCouponReport: (id, params) =>
    apiClient.get(
      `/api/admin/coupons/${encodeURIComponent(id)}/report${qs(params)}`,
    ),
  listOffers: () => apiClient.get("/api/admin/offers"),
  createOffer: (body) => apiClient.post("/api/admin/offers", body),
  updateOffer: (id, body) =>
    apiClient.patch(`/api/admin/offers/${encodeURIComponent(id)}`, body),

  listProducts: (params) => apiClient.get(`/api/admin/products${qs(params)}`),
  updateProduct: (id, body) =>
    apiClient.patch(`/api/admin/products/${encodeURIComponent(id)}`, body),
  getProductPriceHistory: (productId) =>
    apiClient.get(
      `/api/admin/products/${encodeURIComponent(productId)}/price-history`,
    ),
  previewProductPriceUpdate: (body) =>
    apiClient.post("/api/admin/pricing/preview", body),
  applyProductPriceChanges: (body) =>
    apiClient.post("/api/admin/pricing/apply", body),
  previewProductPricingExcel: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/api/admin/pricing/import/preview`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(data?.error || `Request failed (${res.status})`, {
        status: res.status,
        body: data,
      });
    }
    return data;
  },
  downloadProductPricingExcel: async () => {
    const res = await fetch(`${BASE_URL}/api/admin/products/export.xlsx`, {
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(body?.error || `Request failed (${res.status})`, {
        status: res.status,
        body,
      });
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    a.download = "esim-products-pricing.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  listCostChanges: (params) =>
    apiClient.get(`/api/admin/pricing/changes${qs(params)}`),

  getFinanceDashboard: (month) =>
    apiClient.get(`/api/admin/finance/dashboard${qs({ month })}`),
  getFinancePnl: ({ from, to } = {}) =>
    apiClient.get(`/api/admin/finance/pnl${qs({ from, to })}`),
  getFinanceCashflow: ({ from, to } = {}) =>
    apiClient.get(`/api/admin/finance/cashflow${qs({ from, to })}`),
  getFinanceBalances: () => apiClient.get("/api/admin/finance/balances"),
  listFinanceExpenses: (params) =>
    apiClient.get(`/api/admin/finance/expenses${qs(params)}`),
  createFinanceExpense: (body) =>
    apiClient.post("/api/admin/finance/expenses", body),
  updateFinanceExpense: (id, body) =>
    apiClient.patch(
      `/api/admin/finance/expenses/${encodeURIComponent(id)}`,
      body,
    ),
  downloadFinanceExpensesCsv: (params) =>
    downloadCsv(
      "/api/admin/finance/expenses/export.csv",
      params,
      "expenses.csv",
    ),
  getFinanceSupplier: () => apiClient.get("/api/admin/finance/supplier"),
  createSupplierTopup: (body) =>
    apiClient.post("/api/admin/finance/supplier/topups", body),
  listFinanceLocks: () => apiClient.get("/api/admin/finance/locks"),
  lockFinanceMonth: (month) =>
    apiClient.post(`/api/admin/finance/locks/${month}`, {}),
  unlockFinanceMonth: (month) =>
    apiClient.post(`/api/admin/finance/locks/${month}/unlock`, {}),
  listFinanceAudit: ({ page = 1 } = {}) =>
    apiClient.get(`/api/admin/finance/audit${qs({ page })}`),
  getFinanceSettings: () => apiClient.get("/api/admin/finance/settings"),
  updateFinanceSettings: (body) =>
    apiClient.put("/api/admin/finance/settings", body),

  listAdminUsers: () => apiClient.get("/api/admin/users"),
  createAdminUser: (body) => apiClient.post("/api/admin/users", body),
  updateAdminUser: (id, body) =>
    apiClient.patch(`/api/admin/users/${encodeURIComponent(id)}`, body),
};
