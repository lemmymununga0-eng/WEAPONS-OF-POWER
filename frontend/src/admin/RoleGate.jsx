import { Navigate, useOutletContext } from "react-router-dom";
import { canAccess } from "./AdminLayout.jsx";

// Wraps an admin page so a role without access is sent back to the overview.
export default function RoleGate({ access, children }) {
  const { me } = useOutletContext();
  if (!me) return <p className="empty-note">Loading…</p>;
  if (!canAccess(me.role, access)) return <Navigate to="/admin" replace />;
  return children;
}
