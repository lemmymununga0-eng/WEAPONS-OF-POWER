import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/client.js";
import { formatRange } from "../../lib/eventDates.js";

export default function EventCard({ event }) {
  return (
    <article className="card">
      {event.flyer_path ? (
        <img className="card-img" src={mediaUrl(event.flyer_path)} alt="" loading="lazy" />
      ) : (
        <div className="card-img card-img-fallback" aria-hidden="true">{formatRange(event)}</div>
      )}
      <div className="card-body">
        <span className="card-meta">
          {formatRange(event)}
          {event.event_time && ` · ${event.event_time}`}
        </span>
        <h3>{event.title}</h3>
        {event.location && <span className="card-meta">{event.location}</span>}
        {event.description && <p className="clamp-2">{event.description}</p>}
        <Link to={`/events/${event.id}`} className="btn-chip">View Event</Link>
      </div>
    </article>
  );
}
