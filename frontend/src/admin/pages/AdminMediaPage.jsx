import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getMediaAdmin, createMedia, updateMedia, deleteMedia } from "../../api/client.js";

const EMPTY = { title: "", kind: "video", category: "", url: "", published: true, file: null };

export default function AdminMediaPage() {
  const { token, notify } = useOutletContext();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reload = () => {
    getMediaAdmin(token).then(setItems);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const add = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setBusy(true);
    setError("");
    try {
      await createMedia(token, form);
      setForm(EMPTY);
      reload();
      notify("Media added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (m) => {
    await updateMedia(token, m.id, { published: !m.published });
    reload();
  };

  const remove = async (id) => {
    await deleteMedia(token, id);
    setConfirmId(null);
    reload();
    notify("Media removed.");
  };

  if (!items) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Media</h2>
      {items.length === 0 && <p className="empty-note">No media yet.</p>}
      <div className="admin-list">
        {items.map((m) => (
          <div className="admin-list-row" key={m.id}>
            <div className="info">
              <b>
                {m.title} <span className="hidden-badge">{m.kind === "photo" ? "Photo" : "Video"}</span>
                {!m.published && <span className="warn-badge">Hidden</span>}
              </b>
              <span>{[m.category, m.url].filter(Boolean).join(" · ")}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => toggle(m)}>
                {m.published ? "Unpublish" : "Publish"}
              </button>
              {confirmId === m.id ? (
                <>
                  <button className="link-btn" onClick={() => remove(m.id)}>
                    Confirm remove
                  </button>
                  <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="link-btn" onClick={() => setConfirmId(m.id)}>
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 24, fontSize: 17 }}>Add media</h3>
      {error && <p className="form-status error">{error}</p>}
      <form className="admin-form-grid" onSubmit={add} style={{ marginTop: 10 }}>
        <div className="field">
          <label htmlFor="md-title">Title</label>
          <input id="md-title" value={form.title} onChange={set("title")} />
        </div>
        <div className="field">
          <label htmlFor="md-kind">Type</label>
          <select id="md-kind" value={form.kind} onChange={set("kind")}>
            <option value="video">Video (YouTube or Facebook link)</option>
            <option value="photo">Photo</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="md-category">Category</label>
          <input id="md-category" value={form.category} onChange={set("category")} placeholder="e.g. Conferences" />
        </div>
        {form.kind === "video" ? (
          <div className="field">
            <label htmlFor="md-url">Video link</label>
            <input id="md-url" value={form.url} onChange={set("url")} placeholder="https://youtube.com/…" />
          </div>
        ) : (
          <div className="field">
            <label htmlFor="md-file">Photo file</label>
            <input id="md-file" type="file" accept="image/*" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] })} />
          </div>
        )}
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label className="checkbox-inline">
            <input type="checkbox" checked={form.published} onChange={set("published")} /> Published
          </label>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Media"}
          </button>
        </div>
      </form>
    </div>
  );
}
