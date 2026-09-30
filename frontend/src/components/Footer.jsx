import Logo from "./Logo.jsx";

export default function Footer({ info }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={26} />
          <span>{info?.name}</span>
        </div>
        <span>
          © {new Date().getFullYear()} {info?.name}. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
