import { useEffect, useState } from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { getMinistry, mediaUrl } from "../api/client.js";

export default function MinistryDetailPage() {
  const { id } = useParams();
  const { ministries } = useOutletContext();
  const [ministry, setMinistry] = useState(undefined);

  useEffect(() => {
    setMinistry(undefined);
    getMinistry(id)
      .then(setMinistry)
      .catch(() => setMinistry(null));
  }, [id]);

  if (ministry === undefined)
    return (
      <section className="section">
        <div className="container">
          <div className="skeleton skeleton-img" />
        </div>
      </section>
    );
  if (ministry === null)
    return (
      <section className="section">
        <div className="container">
          <h2>Ministry not found</h2>
          <p>
            <Link to="/ministries">Back to ministries</Link>
          </p>
        </div>
      </section>
    );

  const others = ministries.filter((m) => m.id !== ministry.id);

  return (
    <section className="section">
      <div className="container narrow">
        <p>
          <Link to="/ministries">← All ministries</Link>
        </p>
        {ministry.image_path && <img className="detail-banner" src={mediaUrl(ministry.image_path)} alt={ministry.name} />}
        <h1 className="detail-title">{ministry.name}</h1>
        {ministry.leader && <p className="card-meta">Led by {ministry.leader}</p>}
        {ministry.description &&
          ministry.description.split(/\n+/).map((p, i) => (
            <p key={i} className="prose">
              {p}
            </p>
          ))}
        {(ministry.meeting_time || ministry.contact_info) && (
          <div className="panel-card">
            {ministry.meeting_time && (
              <p>
                <b>Meets:</b> {ministry.meeting_time}
              </p>
            )}
            {ministry.contact_info && (
              <p>
                <b>Contact:</b> {ministry.contact_info}
              </p>
            )}
          </div>
        )}
        {others.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h3>Other ministries</h3>
            <ul className="clean-list">
              {others.map((m) => (
                <li key={m.id}>
                  <Link to={`/ministries/${m.id}`}>{m.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
