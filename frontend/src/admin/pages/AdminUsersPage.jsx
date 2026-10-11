import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getUsers, createUser, updateUser } from "../../api/client.js";
import { ROLE_LABELS } from "../AdminLayout.jsx";

const EMPTY = { name: "", username: "", email: "", role: "content_manager", password: "" };

export default function AdminUsersPage() {
  const { token, notify, me } = useOutletContext();
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resetId, setResetId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const reload = () => {
    getUsers(token).then(setUsers);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const run = async (fn, okMsg) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      reload();
      notify(okMsg);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const invite = (e) => {
    e.preventDefault();
    run(async () => {
      await createUser(token, form);
      setForm(EMPTY);
      setShowForm(false);
    }, "User added. Share the temporary password with them privately.");
  };

  if (!users) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2>Users</h2>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
          {showForm ? "Close" : "Add User"}
        </button>
      </div>
      <p className="empty-note">Accounts are deactivated, never deleted, so there is always a record of who did what.</p>
      {error && <p className="form-status error" role="alert">{error}</p>}

      {showForm && (
        <form className="admin-form-grid" onSubmit={invite} style={{ marginBottom: 20 }}>
          <div className="field">
            <label htmlFor="u-name">Name</label>
            <input id="u-name" value={form.name} onChange={set("name")} />
          </div>
          <div className="field">
            <label htmlFor="u-username">Username</label>
            <input id="u-username" value={form.username} onChange={set("username")} autoCapitalize="none" />
          </div>
          <div className="field">
            <label htmlFor="u-email">Email (optional)</label>
            <input id="u-email" type="email" value={form.email} onChange={set("email")} />
          </div>
          <div className="field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" value={form.role} onChange={set("role")}>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="u-password">Temporary password</label>
            <input id="u-password" type="text" value={form.password} onChange={set("password")} autoComplete="off" />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Add User"}
            </button>
          </div>
        </form>
      )}

      <div className="admin-list">
        {users.map((u) => {
          const self = u.id === me?.id || u.username === me?.username;
          return (
            <div className="admin-list-row" key={u.id} style={{ flexDirection: "column", alignItems: "stretch", opacity: u.is_active ? 1 : 0.65 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div className="info" style={{ flex: 1, minWidth: 180 }}>
                  <b>
                    {u.name || u.username} {self && <span className="hidden-badge">You</span>}
                    {!u.is_active && <span className="warn-badge">Deactivated</span>}
                  </b>
                  <span>{[u.username, u.email].filter(Boolean).join(" · ")}</span>
                </div>
                <select
                  aria-label={`Role for ${u.username}`}
                  value={u.role}
                  disabled={self || busy}
                  onChange={(e) => run(() => updateUser(token, u.id, { role: e.target.value }), "Role updated.")}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => { setResetId(resetId === u.id ? null : u.id); setNewPassword(""); }}>
                  Reset password
                </button>
                {!self && (
                  <button
                    className="link-btn"
                    onClick={() => run(() => updateUser(token, u.id, { is_active: !u.is_active }), u.is_active ? "User deactivated." : "User reactivated.")}
                  >
                    {u.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                )}
              </div>
              {resetId === u.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <input
                    aria-label={`New temporary password for ${u.username}`}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New temporary password (8+ characters)"
                    autoComplete="off"
                  />
                  <button
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        await updateUser(token, u.id, { password: newPassword });
                        setResetId(null);
                      }, "Password reset. Share it privately.")
                    }
                  >
                    Save password
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
