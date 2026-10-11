import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useLiveStatus } from "../hooks/useLiveStatus.js";
import { formatNextService } from "../lib/liveFormat.js";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/sermons", label: "Sermons" },
  { to: "/events", label: "Events" },
  { to: "/locations", label: "Locations" },
  { to: "/giving", label: "Give" },
  { to: "/contact", label: "Contact" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Nav({ churchName }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);
  const liveStatus = useLiveStatus();

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
        <Link to="/live" className={`nav-live-btn ${liveStatus?.is_live ? "is-live" : ""}`}>
          {liveStatus?.is_live
            ? `Live now: ${liveStatus.title}`
            : liveStatus?.next_service
              ? `Next service: ${formatNextService(liveStatus.next_service)}`
              : "Watch Live"}
        </Link>
        <button
          ref={toggleRef}
          className="nav-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="nav-drawer"
        >
          <span className="nav-toggle-icon" aria-hidden="true">☰</span>
          <span className="nav-toggle-text">Menu</span>
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
              end={link.end}
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
