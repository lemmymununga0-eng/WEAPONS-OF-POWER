import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import { getAdminMe, setUnauthorizedHandler } from "../api/client.js";
import Toast from "./Toast.jsx";

const NAV_ITEMS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/church-info", label: "Church Info" },
  { to: "/admin/ministries", label: "Ministries" },
  { to: "/admin/events", label: "Events" },
  { to: "/admin/sermons", label: "Sermons" },
  { to: "/admin/branches", label: "Branches" },
  { to: "/admin/livestream", label: "Livestream" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/account", label: "Account" },
];

export default function AdminLayout() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [me, setMe] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  const notify = (text) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(""), 2500);
  };

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
          <b>Admin</b>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map((item) => (
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
          <a href="/" target="_blank" rel="noreferrer">
            View live site
          </a>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      {drawerOpen && <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

      <main className="admin-main">
        {me?.using_default_password && (
          <div className="admin-warning-banner" role="alert">
            You're still using the default admin password. <NavLink to="/admin/account">Change it now</NavLink> before
            this site is shared publicly.
          </div>
        )}
        <Outlet context={{ token, notify, meLoaded: !!me, reloadMe }} />
      </main>

      <Toast message={toastMsg} />
    </div>
  );
}
