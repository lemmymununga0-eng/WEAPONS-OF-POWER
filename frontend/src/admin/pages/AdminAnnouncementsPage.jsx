import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getAnnouncementsAdmin,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/client.js";

const EMPTY = { title: "", body: "", priority: "normal", start_date: "", end_date: "", published: true };

function statusOf(a) {
  const today = new Date().toISOString().slice(0, 10);
  if (!a.published) return "Hidden";
  if (a.end_date && a.end_date < today) return "Expired";
  if (a.start_date && a.start_date > today) return "Scheduled";
  return "Active";
}

export default function AdminAnnouncementsPage() {
  const { token, notify } = useOutletContext();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    getAnnouncementsAdmin(token).then(setItems);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    setError("");
    try {
      if (editingId) await updateAnnouncement(token, editingId, form);
      else await createAnnouncement(token, form);
      notify(editingId ? "Announcement updated." : "Announcement added.");
      setForm(EMPTY);
      setEditingId(null);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await deleteAnnouncement(token, id);
    setConfirmId(null);
    reload();
    notify("Announcement removed.");
  };

  if (!items) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Announcements</h2>
      <p className="empty-note">The newest active announcement shows as a banner on the home page. Expired ones stay here until you remove them.</p>
      {items.length === 0 && <p className="empty-note">No announcements yet.</p>}
      <div className="admin-list">
        {items.map((a) => {
          const st = statusOf(a);
          return (
            <div className={`admin-list-row ${st === "Expired" ? "muted-row" : ""}`} key={a.id} style={st === "Expired" ? { opacity: 0.6 } : undefined}>
              <div className="info">
                <b>
                  {a.title} <span className="hidden-badge">{st}</span>
                  {a.priority === "high" && <span className="warn-badge">High</span>}
                </b>
                <span>
                  {a.start_date || "any time"} → {a.end_date || "no end"}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="link-btn"
                  style={{ color: "var(--accent)" }}
                  onClick={() => {
                    setEditingId(a.id);
                    setForm({ title: a.title, body: a.body, priority: a.priority, start_date: a.start_date, end_date: a.end_date, published: a.published });
                  }}
                >
                  Edit
                </button>
                {confirmId === a.id ? (
                  <>
                    <button className="link-btn" onClick={() => remove(a.id)}>
                      Confirm remove
                    </button>
                    <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="link-btn" onClick={() => setConfirmId(a.id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <h3 style={{ marginTop: 24, fontSize: 17 }}>{editingId ? "Edit announcement" : "Add an announcement"}</h3>
      {error && <p className="form-status error">{error}</p>}
      <form className="admin-form-grid" onSubmit={submit} style={{ marginTop: 10 }}>
        <div className="field">
          <label htmlFor="an-title">Title</label>
          <input id="an-title" value={form.title} onChange={set("title")} />
        </div>
        <div className="field">
          <label htmlFor="an-priority">Priority</label>
          <select id="an-priority" value={form.priority} onChange={set("priority")}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="an-start">Start date (optional)</label>
          <input id="an-start" type="date" value={form.start_date} onChange={set("start_date")} />
        </div>
        <div className="field">
          <label htmlFor="an-end">End date (optional)</label>
          <input id="an-end" type="date" value={form.end_date} onChange={set("end_date")} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="an-body">Message</label>
          <textarea id="an-body" value={form.body} onChange={set("body")} />
          <label className="checkbox-inline">
            <input type="checkbox" checked={form.published} onChange={set("published")} /> Published
          </label>
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save" : "Add Announcement"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-outline on-light"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
