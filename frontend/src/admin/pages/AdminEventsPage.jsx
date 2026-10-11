import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getEventsAdmin, createEvent, updateEvent, deleteEvent } from "../../api/client.js";

const EMPTY = {
  title: "",
  description: "",
  event_date: "",
  end_date: "",
  event_time: "",
  location: "",
  speaker: "",
  registration_enabled: false,
  registration_url: "",
  published: true,
  flyer: null,
};

function EventFields({ form, setForm, prefix }) {
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return (
    <>
      <div className="field">
        <label htmlFor={`${prefix}-title`}>Title</label>
        <input id={`${prefix}-title`} value={form.title} onChange={set("title")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-date`}>Start date</label>
        <input id={`${prefix}-date`} type="date" value={form.event_date} onChange={set("event_date")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-end`}>End date (optional)</label>
        <input id={`${prefix}-end`} type="date" value={form.end_date} onChange={set("end_date")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-time`}>Time</label>
        <input id={`${prefix}-time`} value={form.event_time} onChange={set("event_time")} placeholder="e.g. 18:00" />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-location`}>Location</label>
        <input id={`${prefix}-location`} value={form.location} onChange={set("location")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-speaker`}>Speaker (optional)</label>
        <input id={`${prefix}-speaker`} value={form.speaker} onChange={set("speaker")} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-flyer`}>Banner image (optional)</label>
        <input id={`${prefix}-flyer`} type="file" accept="image/*" onChange={(e) => setForm({ ...form, flyer: e.target.files?.[0] })} />
      </div>
      <div className="field">
        <label htmlFor={`${prefix}-reg-url`}>Registration link</label>
        <input id={`${prefix}-reg-url`} value={form.registration_url} onChange={set("registration_url")} placeholder="https://" />
        <label className="checkbox-inline">
          <input type="checkbox" checked={form.registration_enabled} onChange={set("registration_enabled")} /> Registration is open
        </label>
      </div>
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={`${prefix}-description`}>Description</label>
        <textarea id={`${prefix}-description`} value={form.description} onChange={set("description")} />
        <label className="checkbox-inline">
          <input type="checkbox" checked={form.published} onChange={set("published")} /> Published (visible on the website)
        </label>
      </div>
    </>
  );
}

const toForm = (ev) => ({
  title: ev.title,
  description: ev.description,
  event_date: ev.event_date,
  end_date: ev.end_date || "",
  event_time: ev.event_time,
  location: ev.location,
  speaker: ev.speaker || "",
  registration_enabled: !!ev.registration_enabled,
  registration_url: ev.registration_url || "",
  published: ev.published !== false,
  flyer: null,
});

export default function AdminEventsPage() {
  const { token, notify } = useOutletContext();
  const [events, setEvents] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Block body — see AdminChurchInfoPage.jsx for why a concise arrow here
  // (implicitly returning the fetch Promise) breaks useEffect's cleanup.
  const reload = () => {
    getEventsAdmin(token).then(setEvents);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    setBusy(true);
    setError("");
    try {
      await createEvent(token, form);
      setForm(EMPTY);
      reload();
      notify("Event added.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id) => {
    setBusy(true);
    setError("");
    try {
      await updateEvent(token, id, editForm);
      setEditingId(null);
      reload();
      notify("Event updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePublished = async (ev) => {
    await updateEvent(token, ev.id, { published: !(ev.published !== false) });
    reload();
    notify(ev.published !== false ? "Event hidden from the website." : "Event published.");
  };

  const remove = async (id) => {
    await deleteEvent(token, id);
    setConfirmDeleteId(null);
    reload();
    notify("Event removed.");
  };

  if (!events) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Events</h2>
      {error && <p className="form-status error">{error}</p>}
      {events.length === 0 && <p className="empty-note">No events yet.</p>}
      <div className="admin-list">
        {events.map((ev) =>
          editingId === ev.id ? (
            <div className="admin-list-row" key={ev.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="admin-form-grid">
                <EventFields form={editForm} setForm={setEditForm} prefix={`ev-edit-${ev.id}`} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" disabled={busy} onClick={() => saveEdit(ev.id)}>
                  {busy ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-outline on-light" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-list-row" key={ev.id}>
              <div className="info">
                <b>
                  {ev.title} {ev.published === false && <span className="hidden-badge">Hidden</span>}
                </b>
                <span>
                  {ev.event_date}
                  {ev.end_date && ` – ${ev.end_date}`} {ev.event_time}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="link-btn"
                  style={{ color: "var(--accent)" }}
                  onClick={() => {
                    setEditingId(ev.id);
                    setEditForm(toForm(ev));
                  }}
                >
                  Edit
                </button>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => togglePublished(ev)}>
                  {ev.published === false ? "Publish" : "Unpublish"}
                </button>
                {confirmDeleteId === ev.id ? (
                  <>
                    <button className="link-btn" onClick={() => remove(ev.id)}>
                      Confirm remove
                    </button>
                    <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="link-btn" onClick={() => setConfirmDeleteId(ev.id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
      <h3 style={{ marginTop: 24, fontSize: 17 }}>Add an event</h3>
      <form id="add-form" className="admin-form-grid" onSubmit={add} style={{ marginTop: 10 }}>
        <EventFields form={form} setForm={setForm} prefix="ev" />
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
