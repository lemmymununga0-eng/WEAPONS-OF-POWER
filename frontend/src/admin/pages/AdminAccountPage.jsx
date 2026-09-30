import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { changePassword } from "../../api/client.js";

export default function AdminAccountPage() {
  const { token, notify, reloadMe } = useOutletContext();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(token, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Password changed.");
      reloadMe();
    } catch (err) {
      setError(err.message || "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Account</h2>
      <div className="admin-card">
        <h2>Change Admin Password</h2>
        <form className="admin-form-grid" onSubmit={submit}>
          <div className="field">
            <label>Current password</label>
            <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>New password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <span className="form-status error">{error}</span>}
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
