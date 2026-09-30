import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getSermonsAdmin, createSermon, updateSermon, deleteSermon } from "../../api/client.js";

const EMPTY = {
  title: "",
  speaker: "",
  sermon_date: "",
  external_link: "",
  notes: "",
  category: "",
  scripture: "",
  published: true,
  media: null,
};

export default function AdminSermonsPage() {
  const { token, notify } = useOutletContext();
  const [sermons, setSermons] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Block body — see AdminChurchInfoPage.jsx for why a concise arrow here
  // (implicitly returning the fetch Promise) breaks useEffect's cleanup.
  const reload = () => {
    getSermonsAdmin(token).then(setSermons);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    try {
      await createSermon(token, form);
      setForm(EMPTY);
      reload();
      notify("Sermon added.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({
      title: s.title,
      speaker: s.speaker,
      sermon_date: s.sermon_date,
      external_link: s.external_link,
      notes: s.notes,
      category: s.category,
      scripture: s.scripture,
      published: s.published,
      media: null,
    });
  };

  const saveEdit = async (id) => {
    setBusy(true);
    try {
      await updateSermon(token, id, editForm);
      setEditingId(null);
      reload();
      notify("Sermon updated.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    await deleteSermon(token, id);
    setConfirmDeleteId(null);
    reload();
    notify("Sermon removed.");
  };

  if (!sermons) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Sermons</h2>
      {sermons.length === 0 && <p className="empty-note">No sermons yet.</p>}
      <div className="admin-list">
        {sermons.map((s) =>
          editingId === s.id ? (
            <div className="admin-list-row" key={s.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="admin-form-grid">
                <input
                  aria-label="Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Title"
                />
                <input
                  aria-label="Speaker"
                  value={editForm.speaker}
                  onChange={(e) => setEditForm({ ...editForm, speaker: e.target.value })}
                  placeholder="Speaker"
                />
                <input
                  aria-label="Sermon date"
                  type="date"
                  value={editForm.sermon_date}
                  onChange={(e) => setEditForm({ ...editForm, sermon_date: e.target.value })}
                />
                <input
                  aria-label="Category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="Category"
                />
                <input
                  aria-label="Scripture"
                  value={editForm.scripture}
                  onChange={(e) => setEditForm({ ...editForm, scripture: e.target.value })}
                  placeholder="Scripture, e.g. John 3:16"
                />
                <input
                  aria-label="External link"
                  value={editForm.external_link}
                  onChange={(e) => setEditForm({ ...editForm, external_link: e.target.value })}
                  placeholder="External link"
                />
                <input
                  aria-label="Audio or video file"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setEditForm({ ...editForm, media: e.target.files?.[0] })}
                />
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={editForm.published}
                    onChange={(e) => setEditForm({ ...editForm, published: e.target.checked })}
                  />
                  Published
                </label>
                <textarea
                  aria-label="Notes"
                  style={{ gridColumn: "1 / -1" }}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Notes"
                />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy} onClick={() => saveEdit(s.id)}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-outline on-light" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-list-row" key={s.id}>
              <div className="info">
                <b>
                  {s.title} {!s.published && <span className="hidden-badge">Draft</span>}
                </b>
                <span>
                  {[s.speaker, s.sermon_date, s.category].filter(Boolean).join(" · ")}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => startEdit(s)}>
                  Edit
                </button>
                {confirmDeleteId === s.id ? (
                  <>
                    <button className="link-btn" onClick={() => remove(s.id)}>
                      Confirm remove
                    </button>
                    <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="link-btn" onClick={() => setConfirmDeleteId(s.id)}>
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
          <label htmlFor="sm-title">Title</label>
          <input id="sm-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="sm-speaker">Speaker</label>
          <input id="sm-speaker" value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="sm-date">Date</label>
          <input
            id="sm-date"
            type="date"
            value={form.sermon_date}
            onChange={(e) => setForm({ ...form, sermon_date: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="sm-category">Category</label>
          <input id="sm-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="sm-scripture">Scripture</label>
          <input
            id="sm-scripture"
            value={form.scripture}
            onChange={(e) => setForm({ ...form, scripture: e.target.value })}
            placeholder="e.g. John 3:16"
          />
        </div>
        <div className="field">
          <label htmlFor="sm-link">External link (YouTube, etc.)</label>
          <input id="sm-link" value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="sm-media">Or upload audio/video</label>
          <input id="sm-media" type="file" accept="audio/*,video/*" onChange={(e) => setForm({ ...form, media: e.target.files?.[0] })} />
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Publish immediately
          </label>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="sm-notes">Notes</label>
          <textarea id="sm-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Sermon"}
          </button>
        </div>
      </form>
    </div>
  );
}
