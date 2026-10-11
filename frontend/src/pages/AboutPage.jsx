import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getLeaders, mediaUrl } from "../api/client.js";
import { SkeletonCards, PageHead } from "../components/common/Skeleton.jsx";

function LeaderCard({ leader }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="card">
      {leader.photo_path ? (
        <img className="card-img portrait" src={mediaUrl(leader.photo_path)} alt={leader.name} loading="lazy" />
      ) : (
        <div className="card-img card-img-fallback portrait" aria-hidden="true">
          {leader.name.charAt(0)}
        </div>
      )}
      <div className="card-body">
        <h3>{leader.name}</h3>
        <span className="card-meta">{leader.position}</span>
        {leader.biography && (
          <>
            {open && <p>{leader.biography}</p>}
            <button type="button" className="btn-chip" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? "Show less" : "Biography"}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function AboutPage() {
  const { info } = useOutletContext();
  const [leaders, setLeaders] = useState(undefined);
  useEffect(() => {
    getLeaders()
      .then(setLeaders)
      .catch(() => setLeaders([]));
  }, []);

  const beliefs = (info?.beliefs || "")
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      <header className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <span className="eyebrow">Who we are</span>
            <h1>{info?.name}</h1>
          </div>
        </div>
      </header>

      {info?.history && (
        <section className="section">
          <div className="container narrow">
            <PageHead eyebrow="Our story" title="History" />
            {info.history.split(/\n+/).map((p, i) => (
              <p key={i} className="prose">
                {p}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="section alt">
        <div className="container">
          <div className="card-grid two">
            <div className="panel-card">
              <h3>Mission</h3>
              <p>{info?.mission || "Our mission statement is coming soon."}</p>
            </div>
            <div className="panel-card">
              <h3>Vision</h3>
              <p>{info?.vision || "Our vision statement is coming soon."}</p>
            </div>
          </div>
        </div>
      </section>

      {beliefs.length > 0 && (
        <section className="section">
          <div className="container">
            <PageHead eyebrow="What we hold to" title="Beliefs & Values" />
            <ul className="belief-grid">
              {beliefs.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section alt">
        <div className="container">
          <PageHead eyebrow="Leadership" title="Our Leaders" />
          {leaders === undefined && <SkeletonCards count={2} />}
          {leaders && leaders.length === 0 && info?.founder_name && (
            <div className="card-grid">
              <LeaderCard
                leader={{
                  name: info.founder_name,
                  position: info.founder_title,
                  photo_path: info.founder_photo,
                  biography: info.founder_bio,
                }}
              />
            </div>
          )}
          {leaders && leaders.length > 0 && (
            <div className="card-grid">
              {leaders.map((l) => (
                <LeaderCard key={l.id} leader={l} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
