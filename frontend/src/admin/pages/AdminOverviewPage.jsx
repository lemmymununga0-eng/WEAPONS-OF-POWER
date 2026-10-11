import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { canAccess } from "../AdminLayout.jsx";
import { getBranches, getEvents, getSermons, getMessages, getPrayerRequests } from "../../api/client.js";

// "#add-form" scrolls the page down to its blank add form.
const QUICK_ACTIONS = [
  { label: "Add a ministry", to: "/admin/ministries#add-form", access: "all" },
  { label: "Add an event", to: "/admin/events#add-form", access: "all" },
  { label: "Add a sermon", to: "/admin/sermons#add-form", access: "all" },
  { label: "Add an announcement", to: "/admin/announcements", access: "all" },
  { label: "Add a branch", to: "/admin/branches", state: { openNew: true }, access: "admin" },
  { label: "Read prayer requests", to: "/admin/prayer-requests", access: "admin" },
  { label: "Read messages", to: "/admin/messages", access: "admin" },
];

export default function AdminOverviewPage() {
  const { token, me } = useOutletContext();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([getBranches({ include_inactive: true }, token).catch(() => []), getEvents(), getSermons(), getMessages(token).catch(() => []), getPrayerRequests(token, { status: "New" }).catch(() => [])]).then(
      ([branches, events, sermons, messages, newPrayers]) => {
        const today = new Date().toISOString().slice(0, 10);
        setCounts({
          branches: branches.length,
          upcomingEvents: events.filter((e) => e.event_date >= today).length,
          publishedSermons: sermons.length,
          unreadMessages: messages.filter((m) => !m.read).length,
          newPrayers: newPrayers.length,
        });
      }
    );
  }, [token]);

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Overview</h2>

      {!counts ? (
        <p className="empty-note">Loading…</p>
      ) : (
        <div className="admin-overview-grid">
          <div className="admin-stat-tile">
            <div className="num">{counts.branches}</div>
            <div className="label">Branches</div>
          </div>
          <div className="admin-stat-tile">
            <div className="num">{counts.upcomingEvents}</div>
            <div className="label">Upcoming events</div>
          </div>
          <div className="admin-stat-tile">
            <div className="num">{counts.publishedSermons}</div>
            <div className="label">Published sermons</div>
          </div>
          <div className="admin-stat-tile">
            <div className="num">{counts.unreadMessages}</div>
            <div className="label">Unread messages</div>
          </div>
          <div className="admin-stat-tile">
            <div className="num">{counts.newPrayers}</div>
            <div className="label">New prayer requests</div>
          </div>
        </div>
      )}

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h2>Quick actions</h2>
        <div className="admin-quick-actions">
          {QUICK_ACTIONS.filter((a) => !me || canAccess(me.role, a.access)).map((a) => (
            <Link key={a.label} className="btn btn-outline on-light" to={a.to} state={a.state}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
