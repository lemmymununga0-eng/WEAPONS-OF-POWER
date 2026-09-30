import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";

const LINKS = [
  { to: "/#about", label: "About" },
  { to: "/#ministries", label: "Ministries" },
  { to: "/sermons", label: "Sermons" },
  { to: "/locations", label: "Locations" },
  { to: "/events", label: "Events" },
  { to: "/#give", label: "Give" },
  { to: "/#contact", label: "Contact" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Nav({ churchName }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);

  // Close on route (path or hash) change.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Esc closes, and focus trap while open.
  useEffect(() => {
    if (!open) return;

    const drawer = drawerRef.current;
    const focusables = drawer ? Array.from(drawer.querySelectorAll(FOCUSABLE)) : [];
    focusables[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key === "Tab" && focusables.length > 0) {
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <nav className="site-nav">
      <div className="container">
        <Link to="/" className="brand">
          <Logo size={32} />
          <span>{churchName}</span>
        </Link>
        <Link to="/live" className="nav-live-btn">
          Watch Live
        </Link>
        <button
          ref={toggleRef}
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-drawer"
        >
          Menu
        </button>
        <div
          id="nav-drawer"
          ref={drawerRef}
          className={`nav-links ${open ? "open" : ""}`}
        >
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
