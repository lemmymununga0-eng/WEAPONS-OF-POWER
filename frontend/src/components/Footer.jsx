import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

export default function Footer({ info }) {
  const socials = [
    ["Facebook", info?.facebook],
    ["YouTube", info?.youtube],
    ["Instagram", info?.instagram],
  ].filter(([, v]) => v);

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={26} />
            <span>{info?.name}</span>
          </div>
          {info?.location && <span>{info.location}</span>}
        </div>
        <div className="footer-col">
          <b>Explore</b>
          <Link to="/about">About</Link>
          <Link to="/sermons">Sermons</Link>
          <Link to="/events">Events</Link>
          <Link to="/prayer">Prayer Request</Link>
          <Link to="/giving">Giving</Link>
        </div>
        <div className="footer-col">
          <b>Contact</b>
          {info?.phone && <span>{info.phone}</span>}
          {info?.email && <span>{info.email}</span>}
          {socials.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
          <Link to="/contact">Send a message</Link>
        </div>
      </div>
      <div className="container footer-legal">
        <span>
          © {new Date().getFullYear()} {info?.name}. All rights reserved.
        </span>
        <Link to="/admin/login">Admin Login</Link>
      </div>
    </footer>
  );
}
