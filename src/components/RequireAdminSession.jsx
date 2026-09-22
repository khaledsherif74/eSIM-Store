import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "./ui/Spinner.jsx";
import { adminApi } from "../services/adminApi.js";

export function RequireAdminSession({ children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    adminApi
      .session()
      .then((s) => setState(s.isAdmin ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  if (state === "checking") {
    return (
      <div
        className="container"
        style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}
      >
        <Spinner label="Checking session…" />
      </div>
    );
  }
  if (state === "out") return <Navigate to="/admin/login" replace />;
  return children;
}
