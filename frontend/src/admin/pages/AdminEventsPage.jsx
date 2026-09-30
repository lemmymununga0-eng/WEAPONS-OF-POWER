import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getEvents, createEvent, deleteEvent } from "../../api/client.js";

const EMPTY = { title: "", description: "", event_date: "", event_time: "", location: "", flyer: null };

export default function AdminEventsPage() {
  const { token, notify } = useOutletContext();
  const [events, setEvents] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

  // Block body — see AdminChurchInfoPage.jsx for why a concise arrow here
  // (implicitly returning the fetch Promise) breaks useEffect's cleanup.
  const reload = () => {
    getEvents().then(setEvents);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    setBusy(true);
    try {
      await createEvent(token, form);
      setForm(EMPTY);
      reload();
      notify("Event added.");
    } finally {
      setBusy(false);
    }
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
      {events.length === 0 && <p className="empty-note">No events yet.</p>}
      <div className="admin-list">
        {events.map((ev) => (
          <div className="admin-list-row" key={ev.id}>
            <div className="info">
              <b>{ev.title}</b>
              <span>
                {ev.event_date} {ev.event_time}
              </span>
            </div>
            {confirmDeleteId === ev.id ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="link-btn" onClick={() => remove(ev.id)}>
                  Confirm remove
                </button>
                <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="link-btn" onClick={() => setConfirmDeleteId(ev.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <form className="admin-form-grid" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="ev-title">Title</label>
          <input id="ev-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="ev-date">Date</label>
          <input
            id="ev-date"
            type="date"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="ev-time">Time</label>
          <input
            id="ev-time"
            value={form.event_time}
            onChange={(e) => setForm({ ...form, event_time: e.target.value })}
            placeholder="e.g. 18:00"
          />
        </div>
        <div className="field">
          <label htmlFor="ev-location">Location</label>
          <input id="ev-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="ev-flyer">Flyer (optional)</label>
          <input id="ev-flyer" type="file" accept="image/*" onChange={(e) => setForm({ ...form, flyer: e.target.files?.[0] })} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ev-description">Description</label>
          <textarea
            id="ev-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Add Event"}
          </button>
        </div>
      </form>
    </div>
  );
}
