const STORAGE_KEY = "esim_store_orders_v2";
export function loadStoredOrders() { try { const raw = localStorage.getItem(STORAGE_KEY); const value = raw ? JSON.parse(raw) : []; return Array.isArray(value) ? value.filter((x) => x?.id && x?.token) : []; } catch { return []; } }
export function loadStoredOrderIds() { return loadStoredOrders().map((x) => x.id); }
export function rememberOrder(orderId, accessToken) { if (!orderId || !accessToken) return; const items = loadStoredOrders().filter((x) => x.id !== orderId); items.unshift({ id: orderId, token: accessToken }); localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 25))); }
export function getOrderAccess(orderId) { return loadStoredOrders().find((x) => x.id === orderId) || null; }
export function forgetOrder(orderId) { const items = loadStoredOrders().filter((x) => x.id !== orderId); localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
export function getLatestOrderId() { return loadStoredOrderIds()[0] || null; }
