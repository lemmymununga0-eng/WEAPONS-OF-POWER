import { useState } from "react";
import Logo from "./Logo.jsx";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#founder", label: "Founder" },
  { href: "#ministries", label: "Ministries" },
  { href: "#events", label: "Events" },
  { href: "#give", label: "Give" },
  { href: "#contact", label: "Contact" },
];

export default function Nav({ churchName }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="site-nav">
      <div className="container">
        <a href="#top" className="brand">
          <Logo size={32} />
          <span>{churchName}</span>
        </a>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          Menu
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <a href="#events" className="nav-cta" onClick={() => setOpen(false)}>
            Plan Your Visit
          </a>
        </div>
      </div>
    </nav>
  );
}
