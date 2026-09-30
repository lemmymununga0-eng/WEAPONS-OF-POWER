import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminLogin } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { access_token } = await adminLogin(username, password);
      login(access_token);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={30} />
          <h1>Admin Sign In</h1>
        </div>
        <p>Not part of the public site — for church staff to manage content.</p>
        {sessionMessage && <span className="form-status error">{sessionMessage}</span>}
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <span className="form-status error">{error}</span>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
