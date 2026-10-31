import { createContext, useContext } from "react";

export const AdminSessionContext = createContext(null);

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext);
  if (!ctx)
    throw new Error("useAdminSession must be used inside RequireAdminSession");
  return ctx;
}

export const ROLE_HOME = {
  Admin: "/admin",
  Accountant: "/finance",
  Support: "/admin/operations",
  Operator: "/admin/products",
};

export function homeForRole(role) {
  return ROLE_HOME[role] || "/admin/login";
}
