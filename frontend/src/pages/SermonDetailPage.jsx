import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSermon } from "../api/client.js";
import { usePlayer } from "../player/PlayerContext.jsx";
import { sermonMediaKind } from "../lib/mediaKind.js";
import { toEmbedUrl } from "../lib/embedUrl.js";

export default function SermonDetailPage() {
  const { id } = useParams();
  const [sermon, setSermon] = useState(null);
  const [error, setError] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { play, current } = usePlayer();

  useEffect(() => {
    setSermon(null);
    setError(null);
    setVideoLoaded(false);
    getSermon(id)
      .then(setSermon)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p>
            Sermon not found. <Link to="/sermons">Back to Sermons</Link>.
          </p>
        </div>
      </section>
    );
  }
  if (!sermon) {
    return (
      <section className="section">
        <div className="container">Loading…</div>
      </section>
    );
  }

  const kind = sermonMediaKind(sermon);
  const isPlayingThis = current?.id === sermon.id;

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">{[sermon.speaker, sermon.sermon_date].filter(Boolean).join(" · ")}</span>
          <h2>{sermon.title}</h2>
        </div>

        <div className="sermon-detail-meta">
          {sermon.category && <span className="kind-badge">{sermon.category}</span>}
          {sermon.scripture && <span className="sermon-card-scripture">{sermon.scripture}</span>}
        </div>

        {kind === "audio" && (
          <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => play(sermon)}>
            {isPlayingThis ? "Playing…" : "Play sermon"}
          </button>
        )}

        {kind === "video" && sermon.external_link && (
          <div style={{ marginTop: 16 }}>
            {!videoLoaded ? (
              <button type="button" className="btn btn-primary" onClick={() => setVideoLoaded(true)}>
                Watch
              </button>
            ) : (
              <div className="sermon-embed-wrap large">
                <iframe src={toEmbedUrl(sermon.external_link)} title={sermon.title} loading="lazy" allowFullScreen />
              </div>
            )}
          </div>
        )}

        {sermon.notes && (
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>Notes</h3>
            <p style={{ color: "var(--ink-muted)", whiteSpace: "pre-line" }}>{sermon.notes}</p>
          </div>
        )}

        <p style={{ marginTop: 24 }}>
          <Link to="/sermons">← Back to all sermons</Link>
        </p>
      </div>
    </section>
  );
}
