import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  getChurchInfo,
  updateChurchInfo,
  uploadFounderPhoto,
  uploadChurchPhoto,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime,
  reorderServiceTimes,
} from "../../api/client.js";

export default function AdminChurchInfoPage() {
  const { token, notify } = useOutletContext();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  // Block body, not a concise arrow: useEffect(reload) below requires reload
  // to return undefined or a cleanup function, never a Promise (a concise
  // `() => x().then(y)` implicitly returns the Promise, which React then
  // tries to call as a cleanup function on unmount and throws).
  const reload = () => {
    getChurchInfo()
      .then(setInfo)
      .catch((err) => setError(err.message));
  };

  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="empty-note">Couldn't load church info ({error}).</p>;
  if (!info) return <p className="empty-note">Loading…</p>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Church Info</h2>
      <ChurchInfoForm
        info={info}
        token={token}
        onSaved={(updated) => {
          setInfo(updated);
          notify("Church info saved.");
        }}
      />
      <ServiceTimesCard info={info} token={token} onChange={reload} notify={notify} />
    </div>
  );
}

function ChurchInfoForm({ info, token, onSaved }) {
  const [form, setForm] = useState(info);
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await updateChurchInfo(token, form);
      onSaved(updated);
    } finally {
      setBusy(false);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = await uploadFounderPhoto(token, file);
    onSaved(updated);
  };

  const handleChurchPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const updated = await uploadChurchPhoto(token, file);
    onSaved(updated);
  };

  return (
    <div className="admin-card">
      <h2>Church Details</h2>
      <form className="admin-form-grid" onSubmit={save}>
        <div className="field">
          <label htmlFor="ci-name">Church name</label>
          <input id="ci-name" value={form.name} onChange={set("name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-location">Location</label>
          <input id="ci-location" value={form.location} onChange={set("location")} />
        </div>
        <div className="field">
          <label htmlFor="ci-founder-name">Founder name</label>
          <input id="ci-founder-name" value={form.founder_name} onChange={set("founder_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-founder-title">Founder title</label>
          <input id="ci-founder-title" value={form.founder_title} onChange={set("founder_title")} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ci-founder-bio">Founder bio</label>
          <textarea id="ci-founder-bio" value={form.founder_bio} onChange={set("founder_bio")} />
        </div>
        <div className="field">
          <label htmlFor="ci-founder-photo">Founder photo</label>
          <input id="ci-founder-photo" type="file" accept="image/*" onChange={handlePhoto} />
        </div>
        <div className="field">
          <label htmlFor="ci-church-photo">Church / building photo</label>
          <input id="ci-church-photo" type="file" accept="image/*" onChange={handleChurchPhoto} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ci-mission">Mission statement</label>
          <textarea id="ci-mission" value={form.mission} onChange={set("mission")} />
        </div>
        <div className="field">
          <label htmlFor="ci-phone">Phone</label>
          <input id="ci-phone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} />
        </div>
        <div className="field">
          <label htmlFor="ci-whatsapp">WhatsApp</label>
          <input id="ci-whatsapp" type="tel" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} />
        </div>
        <div className="field">
          <label htmlFor="ci-email">Email</label>
          <input id="ci-email" type="email" inputMode="email" value={form.email} onChange={set("email")} />
        </div>
        <div className="field">
          <label htmlFor="ci-facebook">Facebook / social link</label>
          <input id="ci-facebook" value={form.facebook} onChange={set("facebook")} />
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: 16, margin: "8px 0 0" }}>Give / donation details</h3>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ci-give-details">Free-text note (shown above the payment details)</label>
          <textarea id="ci-give-details" value={form.give_details} onChange={set("give_details")} />
        </div>
        <div className="field">
          <label htmlFor="ci-airtel-number">Airtel Money number</label>
          <input
            id="ci-airtel-number"
            type="tel"
            inputMode="tel"
            value={form.airtel_number}
            onChange={set("airtel_number")}
            placeholder="0971234567"
          />
        </div>
        <div className="field">
          <label htmlFor="ci-airtel-name">Airtel Money name</label>
          <input id="ci-airtel-name" value={form.airtel_name} onChange={set("airtel_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-mtn-number">MTN MoMo number</label>
          <input
            id="ci-mtn-number"
            type="tel"
            inputMode="tel"
            value={form.mtn_number}
            onChange={set("mtn_number")}
            placeholder="0961234567"
          />
        </div>
        <div className="field">
          <label htmlFor="ci-mtn-name">MTN MoMo name</label>
          <input id="ci-mtn-name" value={form.mtn_name} onChange={set("mtn_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-zamtel-number">Zamtel Kwacha number</label>
          <input
            id="ci-zamtel-number"
            type="tel"
            inputMode="tel"
            value={form.zamtel_number}
            onChange={set("zamtel_number")}
            placeholder="0951234567"
          />
        </div>
        <div className="field">
          <label htmlFor="ci-zamtel-name">Zamtel Kwacha name</label>
          <input id="ci-zamtel-name" value={form.zamtel_name} onChange={set("zamtel_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-bank-name">Bank name</label>
          <input id="ci-bank-name" value={form.bank_name} onChange={set("bank_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-bank-account-name">Bank account name</label>
          <input id="ci-bank-account-name" value={form.bank_account_name} onChange={set("bank_account_name")} />
        </div>
        <div className="field">
          <label htmlFor="ci-bank-account-number">Bank account number</label>
          <input id="ci-bank-account-number" value={form.bank_account_number} onChange={set("bank_account_number")} />
        </div>
        <div className="field">
          <label htmlFor="ci-bank-branch">Bank branch</label>
          <input id="ci-bank-branch" value={form.bank_branch} onChange={set("bank_branch")} />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save Church Info"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ServiceTimesCard({ info, token, onChange, notify }) {
  const times = [...(info.service_times || [])].sort((a, b) => a.sort_order - b.sort_order);
  const [form, setForm] = useState({ day: "Sunday", label: "", start_time: "", end_time: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    if (!form.label || !form.start_time || !form.end_time) return;
    await createServiceTime(token, { ...form, sort_order: times.length });
    setForm({ day: "Sunday", label: "", start_time: "", end_time: "" });
    onChange();
    notify("Service time added.");
  };

  const startEdit = (st) => {
    setEditingId(st.id);
    setEditForm({ day: st.day, label: st.label, start_time: st.start_time, end_time: st.end_time, sort_order: st.sort_order });
  };

  const saveEdit = async (id) => {
    await updateServiceTime(token, id, editForm);
    setEditingId(null);
    onChange();
    notify("Service time updated.");
  };

  const remove = async (id) => {
    await deleteServiceTime(token, id);
    onChange();
    notify("Service time removed.");
  };

  const move = async (index, direction) => {
    const newOrder = [...times];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    await reorderServiceTimes(token, newOrder.map((t) => t.id));
    onChange();
  };

  return (
    <div className="admin-card" style={{ marginTop: 24 }}>
      <h2>Service Times</h2>
      <p style={{ fontSize: 13, color: "var(--ink-muted)", marginTop: -8 }}>
        Used on the homepage schedule and to compute when the site shows "Live now".
      </p>
      <div className="admin-list">
        {times.length === 0 && <p className="empty-note">No service times yet.</p>}
        {times.map((st, i) =>
          editingId === st.id ? (
            <div className="admin-list-row" key={st.id}>
              <div className="admin-form-grid" style={{ flex: 1 }}>
                <select aria-label="Day" value={editForm.day} onChange={(e) => setEditForm({ ...editForm, day: e.target.value })}>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Label"
                  value={editForm.label}
                  onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                  placeholder="Label"
                />
                <input
                  aria-label="Start time"
                  value={editForm.start_time}
                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                  placeholder="09:00"
                />
                <input
                  aria-label="End time"
                  value={editForm.end_time}
                  onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                  placeholder="11:30"
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => saveEdit(st.id)}>
                  Save
                </button>
                <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="admin-list-row" key={st.id}>
              <div className="info">
                <b>
                  {st.day} — {st.label}
                </b>
                <span>
                  {st.start_time} – {st.end_time}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  ↑
                </button>
                <button
                  className="link-btn"
                  style={{ color: "var(--ink-muted)" }}
                  onClick={() => move(i, 1)}
                  disabled={i === times.length - 1}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => startEdit(st)}>
                  Edit
                </button>
                <button className="link-btn" onClick={() => remove(st.id)}>
                  Remove
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <form className="admin-form-grid" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="st-day">Day</label>
          <select id="st-day" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="st-label">Label</label>
          <input
            id="st-label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Morning Service"
          />
        </div>
        <div className="field">
          <label htmlFor="st-start">Start time</label>
          <input
            id="st-start"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            placeholder="09:00"
          />
        </div>
        <div className="field">
          <label htmlFor="st-end">End time</label>
          <input
            id="st-end"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            placeholder="11:30"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit">
            Add Service Time
          </button>
        </div>
      </form>
    </div>
  );
}
