import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getMessages, markMessageRead, deleteMessage } from "../../api/client.js";

const isEmail = (s) => /\S+@\S+\.\S+/.test(s);
const isPhoneish = (s) => /^[+()\-\s\d]{6,}$/.test(s);

export default function AdminMessagesPage() {
  const { token, notify } = useOutletContext();
  const [messages, setMessages] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Block body — see AdminChurchInfoPage.jsx for why a concise arrow here
  // (implicitly returning the fetch Promise) breaks useEffect's cleanup.
  const reload = () => {
    getMessages(token).then(setMessages);
  };
  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    await markMessageRead(token, id);
    reload();
  };

  const remove = async (id) => {
    await deleteMessage(token, id);
    setConfirmDeleteId(null);
    reload();
    notify("Message deleted.");
  };

  if (!messages) return <p className="empty-note">Loading…</p>;

  return (
    <div className="admin-card">
      <h2>Contact Messages</h2>
      {messages.length === 0 && <p className="empty-note">No messages yet.</p>}
      <div className="admin-list">
        {messages.map((m) => (
          <div className="admin-list-row" key={m.id} style={{ alignItems: "flex-start" }}>
            <div className="info">
              <b>
                {m.name} {!m.read && <span className="warn-badge">Unread</span>}
              </b>
              <span>{m.contact_info}</span>
              <span style={{ marginTop: 4 }}>{m.message}</span>
              <div className="branch-card-actions" style={{ marginTop: 8 }}>
                {isPhoneish(m.contact_info) && (
                  <>
                    <a className="btn-chip" href={`tel:${m.contact_info.replace(/[^\d+]/g, "")}`}>
                      Call
                    </a>
                    <a
                      className="btn-chip"
                      href={`https://wa.me/${m.contact_info.replace(/[^\d]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </>
                )}
                {isEmail(m.contact_info) && (
                  <a className="btn-chip" href={`mailto:${m.contact_info}`}>
                    Email
                  </a>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexDirection: "column", alignItems: "flex-end" }}>
              {!m.read && (
                <button className="link-btn" style={{ color: "var(--accent)" }} onClick={() => markRead(m.id)}>
                  Mark read
                </button>
              )}
              {confirmDeleteId === m.id ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="link-btn" onClick={() => remove(m.id)}>
                    Confirm delete
                  </button>
                  <button className="link-btn" style={{ color: "var(--ink-muted)" }} onClick={() => setConfirmDeleteId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="link-btn" onClick={() => setConfirmDeleteId(m.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
