import { mediaUrl } from "../api/client.js";

function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function Events({ info, events }) {
  const days = {};
  (info?.service_times || []).forEach((s) => {
    days[s.day] = days[s.day] || [];
    days[s.day].push(s);
  });

  return (
    <section id="events" className="section alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Join us</span>
          <h2>Events &amp; Service Times</h2>
        </div>

        <table className="service-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Service</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(info?.service_times || []).map((s) => (
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

        <div className="section-head" style={{ marginTop: 40 }}>
          <h3 style={{ fontSize: 19 }}>Upcoming Events</h3>
        </div>
        {events.length === 0 && <p className="empty-note">No upcoming events posted yet — check back soon.</p>}
        <div className="event-list">
          {events.map((e) => (
            <div className="event-row" key={e.id}>
              <div className="event-date-badge">{formatDate(e.event_date)}</div>
              <div>
                <h3>{e.title}</h3>
                <p>{e.description}</p>
                <div className="meta">
                  {e.event_time && <>{e.event_time} </>}
                  {e.location && <>· {e.location}</>}
                </div>
                {e.flyer_path && (
                  <img className="event-flyer" src={mediaUrl(e.flyer_path)} alt={`${e.title} flyer`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
