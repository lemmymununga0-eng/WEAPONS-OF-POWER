import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getLeadersAdmin, createLeader, updateLeader, deleteLeader, mediaUrl } from "../../api/client.js";

const EMPTY = { name: "", position: "", biography: "", sort_order: 0, photo: null };

function Fields({ form, setForm, prefix }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <>
      <div className="field">
        <label htmlFor={`${prefix}-name`}>Name</label>
        <input id={`${prefix}-name`} value={form.name} onChange={set("name")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-position`}>Position</label>
        <input id={`${prefix}-position`} value={form.position} onChange={set("position")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-order`}>Display order</label>
        <input id={`${prefix}-order`} type="number" value={form.sort_order} onChange={set("sort_order")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-photo`}>Photo</label>
        <input id={`${prefix}-photo`} type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] })} />
      </div>
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${prefix}-bio`}>Biography</label>
        <textarea id={`${prefix}-bio`} value={form.biography} onChange={set("biography")} />
      </div>
    </>
  );
}

export default function AdminLeadersPage() {
  const { token, notify } = useOutletContext();
  const [leaders, setLeaders] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    getLeadersAdmin(token).then(setLeaders);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const add = (e) => {
    e.preventDefault();
    if (!form.name) return;
    run(async () => {
      await createLeader(token, form);
      setForm(EMPTY);
    }, "Leader added.");
  };

  const saveEdit = (id) =>
    run(async () => {
      await updateLeader(token, id, editForm);
      setEditingId(null);
    }, "Leader updated.");

  const remove = (id) =>
    run(async () => {
      await deleteLeader(token, id);
      setConfirmId(null);
    }, "Leader removed.");

  if (!leaders) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Leadership</h2>
      <p className="empty-note">The founder's card always shows first on the About page.</p>
      {error && <p className="form-status error">{error}</p>}
      {leaders.length === 0 && <p className="empty-note">No leaders yet.</p>}
      <div className="admin-list">
        {leaders.map((l) =>
          editingId === l.id ? (
            <div className="admin-list-row" key={l.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="admin-form-grid">
                <Fields form={editForm} setForm={setEditForm} prefix={`ld-edit-${l.id}`} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy} onClick={() => saveEdit(l.id)}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-outline on-light" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-list-row" key={l.id}>
              {l.photo_path && (
                <img src={mediaUrl(l.photo_path)} alt="" className="admin-photo-preview" style={{ width: 48, height: 48, marginBottom: 0 }} />
              )}
              <div className="info">
                <b>
                  {l.name} {l.is_founder && <span className="hidden-badge">Founder</span>}
                </b>
                <span>{l.position}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="link-btn"
                  style={{ color: "var(--accent)" }}
                  onClick={() => {
                    setEditingId(l.id);
                    setEditForm({ name: l.name, position: l.position, biography: l.biography, sort_order: l.sort_order, photo: null });
                  }}
                >
                  Edit
                </button>
                {!l.is_founder &&
                  (confirmId === l.id ? (
                    <>
                      <button className="link-btn" onClick={() => remove(l.id)}>
                        Confirm remove
                      </button>
                      <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmId(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button className="link-btn" onClick={() => setConfirmId(l.id)}>
                      Remove
                    </button>
                  ))}
              </div>
            </div>
          )
        )}
      </div>
      <h3 style={{ marginTop: 24, fontSize: 17 }}>Add a leader</h3>
      <form className="admin-form-grid" onSubmit={add} style={{ marginTop: 10 }}>
        <Fields form={form} setForm={setForm} prefix="ld" />
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Leader"}
          </button>
        </div>
      </form>
    </div>
  );
}
