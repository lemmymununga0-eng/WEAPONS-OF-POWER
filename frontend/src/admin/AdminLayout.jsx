import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import { getAdminMe, setUnauthorizedHandler } from "../api/client.js";
import Toast from "./Toast.jsx";

// roles: "all" = every signed-in role, "admin" = admin and super admin,
// "super" = super admin only. The server enforces the same rules.
const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true, access: "all" },
  { to: "/admin/church-info", label: "Church Info", access: "admin" },
  { to: "/admin/ministries", label: "Ministries", access: "all" },
  { to: "/admin/events", label: "Events", access: "all" },
  { to: "/admin/sermons", label: "Sermons", access: "all" },
  { to: "/admin/leadership", label: "Leadership", access: "admin" },
  { to: "/admin/announcements", label: "Announcements", access: "all" },
  { to: "/admin/media", label: "Media", access: "all" },
  { to: "/admin/branches", label: "Branches", access: "admin" },
  { to: "/admin/livestream", label: "Livestream", access: "admin" },
  { to: "/admin/prayer-requests", label: "Prayer Requests", access: "admin" },
  { to: "/admin/messages", label: "Messages", access: "admin" },
  { to: "/admin/users", label: "Users", access: "super" },
  { to: "/admin/account", label: "Account", access: "all" },
];

export const ROLE_LABELS = { super_admin: "Super Admin", admin: "Admin", content_manager: "Content Manager" };

export function canAccess(role, access) {
  if (access === "all") return true;
  if (access === "admin") return role === "admin" || role === "super_admin";
  return role === "super_admin";
}

export default function AdminLayout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const notify = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Safety net: if any admin action fails (server error, item already deleted,
  // no permission), show the reason instead of failing silently.
  useEffect(() => {
    const onRejection = (event) => {
      event.preventDefault();
      notify(event.reason?.message || "Something went wrong. Please try again.");
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  const reloadMe = () => getAdminMe(token).then(setMe).catch(() => {});

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/admin/login", { state: { message: "Please sign in again." } });
    });
    reloadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="admin-shell-v2">
      <button
        type="button"
        className="admin-drawer-toggle"
        onClick={() => setDrawerOpen((o) => !o)}
        aria-expanded={drawerOpen}
        aria-controls="admin-sidebar"
      >
        Menu
      </button>

      <aside id="admin-sidebar" className={`admin-sidebar ${drawerOpen ? "open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Logo size={28} />
          <b>{me?.name ? `Welcome, ${me.name}` : "Admin"}</b>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.filter((item) => (me?.must_change_password ? item.to === "/admin/account" : !me || canAccess(me.role, item.access))).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-link">
            ← Back to website
          </Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <main className="admin-main">
        {me?.must_change_password && (
          <div className="admin-warning-banner" role="alert">
            Choose a new password to continue. Until you do, nothing else in the admin area is available.
          </div>
        )}
        {me?.using_default_password && !me?.must_change_password && (
          <div className="admin-warning-banner" role="alert">
            You're still using the default admin password. <NavLink to="/admin/account">Change it now</NavLink> before
            this site is shared publicly.
          </div>
        )}
        {!me ? (
          <p className="empty-note">Loading…</p>
        ) : me.must_change_password && location.pathname !== "/admin/account" ? (
          <Navigate to="/admin/account" replace />
        ) : (
          <Outlet context={{ token, notify, me, meLoaded: true, reloadMe }} />
        )}
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}
