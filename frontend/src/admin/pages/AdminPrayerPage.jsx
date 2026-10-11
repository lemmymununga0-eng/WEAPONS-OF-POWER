import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getPrayerRequests, setPrayerStatus, deletePrayerRequest } from "../../api/client.js";

const STATUSES = ["New", "In Progress", "Prayed For", "Closed"];
const CATEGORIES = ["Family", "Health", "Work", "Spiritual", "Financial", "Other"];

export default function AdminPrayerPage() {
  const { token, notify } = useOutletContext();
  const [rows, setRows] = useState(null);
  const [filters, setFilters] = useState({ status: "", category: "", confidential: "" });
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const reload = () => {
    getPrayerRequests(token, filters).then(setRows);
  };
  useEffect(reload, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id, status) => {
    await setPrayerStatus(token, id, status);
    reload();
    notify("Status updated.");
  };

  const remove = async (id) => {
    await deletePrayerRequest(token, id);
    setConfirmId(null);
    setOpenId(null);
    reload();
    notify("Prayer request deleted.");
  };

  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.type === "checkbox" ? (e.target.checked ? "true" : "") : e.target.value });

  return (
    <div className="admin-card">
      <h2>Prayer requests</h2>
      <p className="empty-note">Private. These are never shown on the website.</p>
      <div className="admin-form-grid" style={{ marginBottom: 12 }}>
        <div className="field">
          <label htmlFor="pr-status">Status</label>
          <select id="pr-status" value={filters.status} onChange={setF("status")}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pr-category">Category</label>
          <select id="pr-category" value={filters.category} onChange={setF("category")}>
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <label className="checkbox-inline">
          <input type="checkbox" checked={!!filters.confidential} onChange={setF("confidential")} /> Confidential only
        </label>
      </div>

      {!rows && <p className="empty-note">Loading…</p>}
      {rows && rows.length === 0 && <p className="empty-note">No prayer requests yet.</p>}
      <div className="admin-list">
        {rows?.map((r) => (
          <div key={r.id} className="admin-list-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="link-btn"
                style={{ color: "var(--ink)", textAlign: "left", flex: 1 }}
                aria-expanded={openId === r.id}
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
              >
                <b>{r.name || "Anonymous"}</b> {r.confidential && <span title="Confidential">🔒</span>}{" "}
                <span className="hidden-badge">{r.category}</span>{" "}
                <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>{String(r.created_at).slice(0, 10)}</span>
              </button>
              <select aria-label={`Status for request ${r.id}`} value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {openId === r.id && (
              <div style={{ marginTop: 10 }}>
                <p style={{ whiteSpace: "pre-wrap" }}>{r.request}</p>
                {(r.email || r.phone) && (
                  <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
                    {[r.email, r.phone].filter(Boolean).join(" · ")}
                  </p>
                )}
                {confirmId === r.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="link-btn" onClick={() => remove(r.id)}>
                      Confirm delete
                    </button>
                    <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="link-btn" onClick={() => setConfirmId(r.id)}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
