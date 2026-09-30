import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useLiveStatus } from "../hooks/useLiveStatus.js";
import { formatNextService, msUntil, formatCountdown } from "../lib/liveFormat.js";
import { getSermons } from "../api/client.js";

export default function LivePage() {
  const { info } = useOutletContext();
  const liveStatus = useLiveStatus();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [recentSermons, setRecentSermons] = useState([]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    getSermons()
      .then((list) => setRecentSermons(list.slice(0, 3)))
      .catch(() => setRecentSermons([]));
  }, []);

  const sendPrayerRequest = () => {
    navigate("/#contact", { state: { prefillMessage: "Prayer request: " } });
  };

  if (!liveStatus) {
    return (
      <section className="section">
        <div className="container">Loading…</div>
      </section>
    );
  }

  return (
    <section className="section live-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Join us</span>
          <h2>Watch Live</h2>
        </div>

        {liveStatus.is_live ? (
          <>
            <div className="live-badge">● Live now — {liveStatus.title}</div>
            {liveStatus.embed_url ? (
              <div className="live-embed-wrap">
                <iframe
                  src={liveStatus.embed_url}
                  title="Live stream"
                  loading="lazy"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="empty-note">
                We're live, but no stream link has been added yet — check back shortly, or add one via the admin
                dashboard.
              </p>
            )}
            <button type="button" className="btn btn-outline on-light" onClick={sendPrayerRequest} style={{ marginTop: 16 }}>
              Send a prayer request
            </button>
          </>
        ) : (
          <>
            {liveStatus.next_service && (
              <div className="next-service-card">
                <span className="eyebrow">Next service</span>
                <h3>{liveStatus.next_service.label}</h3>
                <p className="countdown" key={tick}>
                  Starts in {formatCountdown(msUntil(liveStatus.next_service.starts_at))} ·{" "}
                  {formatNextService(liveStatus.next_service)} (Lusaka time)
                </p>
              </div>
            )}

            {info?.service_times?.length > 0 && (
              <table className="service-table" style={{ marginTop: 24 }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Service</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {info.service_times.map((s) => (
                    <tr key={s.id}>
                      <td>{s.day}</td>
                      <td>{s.label}</td>
                      <td className="time">
                        {s.start_time} – {s.end_time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {recentSermons.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>Recent recordings</h3>
                <div className="admin-list">
                  {recentSermons.map((s) => (
                    <div className="admin-list-row" key={s.id}>
                      <div className="info">
                        <b>{s.title}</b>
                        <span>
                          {s.speaker} {s.sermon_date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
