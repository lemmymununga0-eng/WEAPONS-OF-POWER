import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getEvent, mediaUrl } from "../api/client.js";
import { formatRange } from "../lib/eventDates.js";
import MapEmbed, { directionsUrl } from "../components/common/MapEmbed.jsx";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(undefined);

  useEffect(() => {
    setEvent(undefined);
    getEvent(id)
      .then(setEvent)
      .catch(() => setEvent(null));
  }, [id]);

  if (event === undefined)
    return (
      <section className="section">
        <div className="container">
          <div className="skeleton skeleton-img" />
        </div>
      </section>
    );
  if (event === null)
    return (
      <section className="section">
        <div className="container">
          <h2>Event not found</h2>
          <p>
            <Link to="/events">Back to events</Link>
          </p>
        </div>
      </section>
    );

  return (
    <section className="section">
      <div className="container narrow">
        <p>
          <Link to="/events">← All events</Link>
        </p>
        {event.flyer_path && <img className="detail-banner" src={mediaUrl(event.flyer_path)} alt={`${event.title} banner`} />}
        <h1 className="detail-title">{event.title}</h1>
        <p className="card-meta">
          {formatRange(event)}
          {event.event_time && ` · ${event.event_time}`}
          {event.location && ` · ${event.location}`}
        </p>
        {event.description &&
          event.description.split(/\n+/).map((p, i) => (
            <p key={i} className="prose">
              {p}
            </p>
          ))}
        {event.speaker && (
          <p>
            <b>Speaker:</b> {event.speaker}
          </p>
        )}
        <div className="panel-card">
          <h3>Registration</h3>
          {event.registration_enabled && event.registration_url ? (
            <a className="btn btn-primary" href={event.registration_url} target="_blank" rel="noreferrer">
              Register
            </a>
          ) : (
            <p>No registration required.</p>
          )}
        </div>
        {event.location && (
          <div style={{ marginTop: 24 }}>
            <MapEmbed address={event.location} title={`Map for ${event.title}`} />
            <p style={{ marginTop: 12 }}>
              <a href={directionsUrl(event.location)} target="_blank" rel="noreferrer">
                Get directions
              </a>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
