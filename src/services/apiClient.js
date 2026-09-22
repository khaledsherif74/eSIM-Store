const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : null;

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, {
      status: res.status,
      body: data,
    });
  }
  return data;
}

export const apiClient = {
  get: (path, options = {}) => request(path, { method: "GET", ...options }),
  post: (path, body, options = {}) =>
    request(path, { method: "POST", body: JSON.stringify(body), ...options }),
  put: (path, body, options = {}) =>
    request(path, { method: "PUT", body: JSON.stringify(body), ...options }),
  patch: (path, body, options = {}) =>
    request(path, { method: "PATCH", body: JSON.stringify(body), ...options }),
};

export { ApiError };
