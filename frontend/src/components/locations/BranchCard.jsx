import { Link } from "react-router-dom";
import { mediaUrl } from "../../api/client.js";
import { callLink, whatsappLink, mailtoLink } from "../../lib/phone.js";
import { formatDistance } from "../../lib/geo.js";

export default function BranchCard({ branch, distanceKm, selected, onSelect }) {
  const showContacts = branch.show_pastor_contacts;
  const hasDirections = branch.latitude != null && branch.longitude != null;
  const directionsHref = hasDirections
    ? `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`
    : null;

  return (
    <div
      id={`branch-card-${branch.id}`}
      className={`branch-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect?.(branch.id)}
    >
      <div className="branch-card-photo">
        {branch.pastor_photo ? (
          <img src={mediaUrl(branch.pastor_photo)} alt={branch.pastor_name} />
        ) : (
          <div className="avatar-initials">{branch.pastor_name.charAt(0)}</div>
        )}
      </div>
      <div className="branch-card-body">
        <div className="branch-card-head">
          <h3>
            <Link to={`/locations/${branch.slug}`}>{branch.name}</Link>
          </h3>
          {branch.is_headquarters && <span className="hq-badge">Headquarters</span>}
        </div>
        <div className="branch-card-pastor">
          {branch.pastor_title} {branch.pastor_name}
        </div>
        <div className="branch-card-meta">
          {[branch.town, branch.province].filter(Boolean).join(", ") || "Location not set"}
          {distanceKm != null && <span className="distance"> · {formatDistance(distanceKm)}</span>}
        </div>
        {branch.service_times && <div className="branch-card-times">{branch.service_times}</div>}
        {!hasDirections && <div className="empty-note">Map pin not added yet</div>}

        <div className="branch-card-actions" onClick={(e) => e.stopPropagation()}>
          {showContacts && branch.pastor_phone && (
            <a href={callLink(branch.pastor_phone)} className="btn-chip">
              Call
            </a>
          )}
          {showContacts && branch.pastor_whatsapp && (
            <a href={whatsappLink(branch.pastor_whatsapp)} target="_blank" rel="noreferrer" className="btn-chip">
              WhatsApp
            </a>
          )}
          {showContacts && branch.pastor_email && (
            <a href={mailtoLink(branch.pastor_email)} className="btn-chip">
              Email
            </a>
          )}
          {directionsHref && (
            <a href={directionsHref} target="_blank" rel="noreferrer" className="btn-chip">
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
