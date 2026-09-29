import { mediaUrl } from "../api/client.js";

export default function Ministries({ ministries }) {
  return (
    <section id="ministries" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Get involved</span>
          <h2>Ministries &amp; Programs</h2>
        </div>
        {ministries.length === 0 && <p className="empty-note">Ministries will be listed here soon.</p>}
        <div className="ministry-grid">
          {ministries.map((m) => (
            <div className="ministry-card" key={m.id}>
              {m.image_path ? (
                <img className="ministry-photo" src={mediaUrl(m.image_path)} alt={m.name} />
              ) : (
                <div className="icon">{m.name.charAt(0)}</div>
              )}
              <h3>{m.name}</h3>
              <p>{m.description}</p>
              {(m.leader || m.meeting_time) && (
                <div className="meta">
                  {m.leader && <>Led by {m.leader} </>}
                  {m.meeting_time && <>· {m.meeting_time}</>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
