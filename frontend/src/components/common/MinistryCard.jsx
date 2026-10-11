import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/client.js";

// With onToggle, the card opens its details in place like a dropdown;
// without it, View links to the ministry's own page.
export default function MinistryCard({ ministry, onToggle, expanded = false, tabIndex }) {
  const detailsId = `ministry-details-${ministry.id}`;
  const hasMore = ministry.meeting_time || ministry.contact_info;

  return (
    <article className={`card ${expanded ? "is-open" : ""}`}>
      {ministry.image_path ? (
        <img className="card-img" src={mediaUrl(ministry.image_path)} alt="" loading="lazy" />
      ) : (
        <div className="card-img card-img-fallback" aria-hidden="true">{ministry.name.charAt(0)}</div>
      )}
      <div className="card-body">
        <h3>{ministry.name}</h3>
        {ministry.leader ? (
          <span className="card-meta">Led by {ministry.leader}</span>
        ) : (
          onToggle && <span className="card-meta" aria-hidden="true">&nbsp;</span>
        )}
        {ministry.description && <p className={expanded ? "" : "clamp-2"}>{ministry.description}</p>}
        {onToggle ? (
          <>
            <div id={detailsId} className={`card-drop ${expanded ? "open" : ""}`}>
              <div className="card-drop-inner">
                {ministry.meeting_time && (
                  <p><b>Meets:</b> {ministry.meeting_time}</p>
                )}
                {ministry.contact_info && (
                  <p><b>Contact:</b> {ministry.contact_info}</p>
                )}
                {!hasMore && <p>More details coming soon.</p>}
              </div>
            </div>
            <button
              type="button"
              className="btn-chip"
              tabIndex={tabIndex}
              aria-expanded={expanded}
              aria-controls={detailsId}
              onClick={() => onToggle(ministry.id)}
            >
              {expanded ? "Hide" : "View"}
            </button>
          </>
        ) : (
          <Link to={`/ministries/${ministry.id}`} className="btn-chip" tabIndex={tabIndex}>View</Link>
        )}
      </div>
    </article>
  );
}
