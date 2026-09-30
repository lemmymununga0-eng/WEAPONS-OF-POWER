import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import {
  getChurchInfo,
  updateChurchInfo,
  uploadFounderPhoto,
  uploadChurchPhoto,
  getMinistries,
  createMinistry,
  deleteMinistry,
  getEvents,
  createEvent,
  deleteEvent,
  getSermonsAdmin,
  createSermon,
  deleteSermon,
  getMessages,
  changePassword,
} from "../api/client.js";
import BranchesSection from "./BranchesSection.jsx";

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [info, setInfo] = useState(null);
  const [ministries, setMinistries] = useState([]);
  const [events, setEvents] = useState([]);
  const [sermons, setSermons] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState("");

  const reload = () => {
    getChurchInfo().then(setInfo);
    getMinistries().then(setMinistries);
    getEvents().then(setEvents);
    getSermonsAdmin(token).then(setSermons);
    getMessages(token).then(setMessages).catch(() => {});
  };

  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2500);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  if (!info) return <div className="admin-shell">Loading…</div>;

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <Logo size={26} />
        <b>Admin Dashboard</b>
        <div className="spacer" />
        <a className="btn btn-outline" href="/" target="_blank" rel="noreferrer">
          View live site
        </a>
        <button className="btn btn-outline" onClick={handleLogout}>
          Log out
        </button>
      </div>

      <div className="admin-body">
        {notice && <div className="form-status ok">{notice}</div>}

        <ChurchInfoCard
          info={info}
          token={token}
          onSaved={(updated) => {
            setInfo(updated);
            flash("Church info saved.");
          }}
        />

        <MinistriesCard
          ministries={ministries}
          token={token}
          onChange={() => {
            getMinistries().then(setMinistries);
            flash("Ministries updated.");
          }}
        />

        <EventsCard
          events={events}
          token={token}
          onChange={() => {
            getEvents().then(setEvents);
            flash("Events updated.");
          }}
        />

        <SermonsCard
          sermons={sermons}
          token={token}
          onChange={() => {
            getSermonsAdmin(token).then(setSermons);
            flash("Sermons updated.");
          }}
        />

        <BranchesSection token={token} onNotice={flash} />

        <MessagesCard messages={messages} />

        <PasswordCard token={token} onSaved={() => flash("Password changed.")} />
      </div>
    </div>
  );
}

// ---------------- Church info ----------------

function ChurchInfoCard({ info, token, onSaved }) {
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
      <h2>Church Info</h2>
      <form className="admin-form-grid" onSubmit={save}>
        <div className="field">
          <label>Church name</label>
          <input value={form.name} onChange={set("name")} />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={form.location} onChange={set("location")} />
        </div>
        <div className="field">
          <label>Founder name</label>
          <input value={form.founder_name} onChange={set("founder_name")} />
        </div>
        <div className="field">
          <label>Founder title</label>
          <input value={form.founder_title} onChange={set("founder_title")} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Founder bio</label>
          <textarea value={form.founder_bio} onChange={set("founder_bio")} />
        </div>
        <div className="field">
          <label>Founder photo</label>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </div>
        <div className="field">
          <label>Church / building photo</label>
          <input type="file" accept="image/*" onChange={handleChurchPhoto} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Mission statement</label>
          <textarea value={form.mission} onChange={set("mission")} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Give / donation details</label>
          <textarea value={form.give_details} onChange={set("give_details")} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={set("phone")} />
        </div>
        <div className="field">
          <label>WhatsApp</label>
          <input value={form.whatsapp} onChange={set("whatsapp")} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={form.email} onChange={set("email")} />
        </div>
        <div className="field">
          <label>Facebook / social link</label>
          <input value={form.facebook} onChange={set("facebook")} />
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

// ---------------- Ministries ----------------

function MinistriesCard({ ministries, token, onChange }) {
  const [form, setForm] = useState({ name: "", description: "", leader: "", meeting_time: "", image: null });

  const add = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    await createMinistry(token, form);
    setForm({ name: "", description: "", leader: "", meeting_time: "", image: null });
    onChange();
  };

  return (
    <div className="admin-card">
      <h2>Ministries</h2>
      <div className="admin-list">
        {ministries.map((m) => (
          <div className="admin-list-row" key={m.id}>
            <div className="info">
              <b>{m.name}</b>
              <span>{m.description}</span>
            </div>
            <button className="link-btn" onClick={() => deleteMinistry(token, m.id).then(onChange)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <form className="admin-form-grid" onSubmit={add}>
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
          <button className="btn btn-primary" type="submit">
            Add Ministry
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------- Events ----------------

function EventsCard({ events, token, onChange }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    flyer: null,
  });

  const add = async (e) => {
    e.preventDefault();
    if (!form.title || !form.event_date) return;
    await createEvent(token, form);
    setForm({ title: "", description: "", event_date: "", event_time: "", location: "", flyer: null });
    onChange();
  };

  return (
    <div className="admin-card">
      <h2>Events</h2>
      <div className="admin-list">
        {events.map((ev) => (
          <div className="admin-list-row" key={ev.id}>
            <div className="info">
              <b>{ev.title}</b>
              <span>
                {ev.event_date} {ev.event_time}
              </span>
            </div>
            <button className="link-btn" onClick={() => deleteEvent(token, ev.id).then(onChange)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <form className="admin-form-grid" onSubmit={add}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
        </div>
        <div className="field">
          <label>Time</label>
          <input value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} placeholder="e.g. 18:00" />
        </div>
        <div className="field">
          <label>Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="field">
          <label>Flyer (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, flyer: e.target.files?.[0] })} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit">
            Add Event
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------- Sermons ----------------

function SermonsCard({ sermons, token, onChange }) {
  const [form, setForm] = useState({
    title: "",
    speaker: "",
    sermon_date: "",
    external_link: "",
    notes: "",
    media: null,
  });

  const add = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    await createSermon(token, form);
    setForm({ title: "", speaker: "", sermon_date: "", external_link: "", notes: "", media: null });
    onChange();
  };

  return (
    <div className="admin-card">
      <h2>Sermons</h2>
      <div className="admin-list">
        {sermons.map((s) => (
          <div className="admin-list-row" key={s.id}>
            <div className="info">
              <b>{s.title}</b>
              <span>
                {s.speaker} {s.sermon_date}
              </span>
            </div>
            <button className="link-btn" onClick={() => deleteSermon(token, s.id).then(onChange)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <form className="admin-form-grid" onSubmit={add}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Speaker</label>
          <input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
        </div>
        <div className="field">
          <label>Date</label>
          <input type="date" value={form.sermon_date} onChange={(e) => setForm({ ...form, sermon_date: e.target.value })} />
        </div>
        <div className="field">
          <label>External link (YouTube, etc.)</label>
          <input value={form.external_link} onChange={(e) => setForm({ ...form, external_link: e.target.value })} />
        </div>
        <div className="field">
          <label>Or upload audio/video</label>
          <input type="file" accept="audio/*,video/*" onChange={(e) => setForm({ ...form, media: e.target.files?.[0] })} />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit">
            Add Sermon
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------- Password ----------------

function PasswordCard({ token, onSaved }) {
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
      onSaved();
    } catch (err) {
      setError(err.message || "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card">
      <h2>Change Admin Password</h2>
      <form className="admin-form-grid" onSubmit={submit}>
        <div className="field">
          <label>Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label>New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
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
  );
}

// ---------------- Contact messages ----------------

function MessagesCard({ messages }) {
  return (
    <div className="admin-card">
      <h2>Contact Messages</h2>
      {messages.length === 0 && <p className="empty-note">No messages yet.</p>}
      <div className="admin-list">
        {messages.map((m) => (
          <div className="admin-list-row" key={m.id}>
            <div className="info">
              <b>
                {m.name} — {m.contact_info}
              </b>
              <span>{m.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
