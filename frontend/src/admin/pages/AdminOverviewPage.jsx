import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getBranches, getEvents, getSermons, getMessages } from "../../api/client.js";

export default function AdminOverviewPage() {
  const { token } = useOutletContext();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.all([getBranches({ include_inactive: true }, token), getEvents(), getSermons(), getMessages(token)]).then(
      ([branches, events, sermons, messages]) => {
        const today = new Date().toISOString().slice(0, 10);
        setCounts({
          branches: branches.length,
          upcomingEvents: events.filter((e) => e.event_date >= today).length,
          publishedSermons: sermons.length,
          unreadMessages: messages.filter((m) => !m.read).length,
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
        </div>
      )}

      <div className="admin-card" style={{ marginTop: 24 }}>
        <h2>Quick actions</h2>
        <div className="admin-quick-actions">
          <Link className="btn btn-outline on-light" to="/admin/ministries">
            Add a ministry
          </Link>
          <Link className="btn btn-outline on-light" to="/admin/events">
            Add an event
          </Link>
          <Link className="btn btn-outline on-light" to="/admin/sermons">
            Add a sermon
          </Link>
          <Link className="btn btn-outline on-light" to="/admin/branches">
            Add a branch
          </Link>
          <Link className="btn btn-outline on-light" to="/admin/messages">
            Read messages
          </Link>
        </div>
      </div>
    </div>
  );
}
