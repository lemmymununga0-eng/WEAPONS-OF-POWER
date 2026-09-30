import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getMinistries, createMinistry, updateMinistry, deleteMinistry, mediaUrl } from "../../api/client.js";

const EMPTY = { name: "", description: "", leader: "", meeting_time: "", image: null };

export default function AdminMinistriesPage() {
  const { token, notify } = useOutletContext();
  const [ministries, setMinistries] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = () => getMinistries().then(setMinistries);
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setBusy(true);
    try {
      await createMinistry(token, form);
      setForm(EMPTY);
      reload();
      notify("Ministry added.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditForm({ name: m.name, description: m.description, leader: m.leader, meeting_time: m.meeting_time, image: null });
  };

  const saveEdit = async (id) => {
    setBusy(true);
    try {
      await updateMinistry(token, id, editForm);
      setEditingId(null);
      reload();
      notify("Ministry updated.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await deleteMinistry(token, id);
    setConfirmDeleteId(null);
    reload();
    notify("Ministry removed.");
  };

  if (!ministries) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Ministries</h2>
      {ministries.length === 0 && <p className="empty-note">No ministries yet.</p>}
      <div className="admin-list">
        {ministries.map((m) =>
          editingId === m.id ? (
            <div className="admin-list-row" key={m.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="admin-form-grid">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                <input value={editForm.leader} onChange={(e) => setEditForm({ ...editForm, leader: e.target.value })} placeholder="Leader" />
                <input
                  value={editForm.meeting_time}
                  onChange={(e) => setEditForm({ ...editForm, meeting_time: e.target.value })}
                  placeholder="Meeting time"
                />
                <input type="file" accept="image/*" onChange={(e) => setEditForm({ ...editForm, image: e.target.files?.[0] })} />
                <textarea
                  style={{ gridColumn: "1 / -1" }}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy} onClick={() => saveEdit(m.id)}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-outline on-light" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-list-row" key={m.id}>
              {m.image_path && <img src={mediaUrl(m.image_path)} alt="" className="admin-photo-preview" style={{ width: 60, height: 44, marginBottom: 0 }} />}
              <div className="info">
                <b>{m.name}</b>
                <span>{m.description}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => startEdit(m)}>
                  Edit
                </button>
                {confirmDeleteId === m.id ? (
                  <>
                    <button className="link-btn" onClick={() => remove(m.id)}>
                      Confirm remove
                    </button>
                    <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="link-btn" onClick={() => setConfirmDeleteId(m.id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <form className="admin-form-grid" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field">
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Leader</label>
          <input value={form.leader} onChange={(e) => setForm({ ...form, leader: e.target.value })} />
        </div>
        <div className="field">
          <label>Meeting time</label>
          <input value={form.meeting_time} onChange={(e) => setForm({ ...form, meeting_time: e.target.value })} />
        </div>
        <div className="field">
          <label>Photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files?.[0] })} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Ministry"}
          </button>
        </div>
      </form>
    </div>
  );
}
