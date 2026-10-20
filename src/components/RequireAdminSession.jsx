import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/Spinner.jsx";
import { adminApi } from "../services/adminApi.js";
import {
  AdminSessionContext,
  homeForRole,
  useAdminSession,
} from "./admin/AdminSessionContext.jsx";

export function RequireAdminSession({ allow, children }) {
  const [state, setState] = useState({ status: "checking", session: null });

  useEffect(() => {
    let alive = true;
    adminApi
      .session()
      .then((s) => {
        if (alive) setState({ status: s.isAdmin ? "in" : "out", session: s });
      })
      .catch(() => alive && setState({ status: "out", session: null }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === "checking") {
    return (
      <div
        className="container"
        style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}
      >
        <Spinner label="Checking session…" />
      </div>
    );
  }
  if (state.status === "out") return <Navigate to="/admin/login" replace />;
  if (allow && !allow.includes(state.session.role)) {
    return <Navigate to={homeForRole(state.session.role)} replace />;
  }
  return (
    <AdminSessionContext.Provider value={state.session}>
      {children || <Outlet />}
    </AdminSessionContext.Provider>
  );
}

export function RoleGate({ allow, children }) {
  const session = useAdminSession();
  if (!allow.includes(session.role)) {
    return <Navigate to={homeForRole(session.role)} replace />;
  }
  return children;
}
