import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlayer } from "../../player/PlayerContext.jsx";
import { sermonMediaKind } from "../../lib/mediaKind.js";
import { toEmbedUrl } from "../../lib/embedUrl.js";

export default function SermonCard({ sermon }) {
  const { play, current } = usePlayer();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const kind = sermonMediaKind(sermon);
  const isPlayingThis = current?.id === sermon.id;

  return (
    <div className="sermon-card">
      <div className="sermon-card-head">
        <h3>
          <Link to={`/sermons/${sermon.id}`}>{sermon.title}</Link>
        </h3>
        {kind && <span className={`kind-badge kind-${kind}`}>{kind === "audio" ? "Audio" : "Video"}</span>}
      </div>
      <div className="sermon-card-meta">
        {[sermon.speaker, sermon.sermon_date, sermon.category].filter(Boolean).join(" · ")}
      </div>
      {sermon.scripture && <div className="sermon-card-scripture">{sermon.scripture}</div>}

      {kind === "audio" && (
        <button type="button" className="btn-chip" onClick={() => play(sermon)}>
          {isPlayingThis ? "Playing…" : "Play"}
        </button>
      )}

      {kind === "video" && sermon.external_link && !videoLoaded && (
        <button type="button" className="btn-chip" onClick={() => setVideoLoaded(true)}>
          Watch
        </button>
      )}
      {kind === "video" && sermon.external_link && videoLoaded && (
        <div className="sermon-embed-wrap">
          <iframe src={toEmbedUrl(sermon.external_link)} title={sermon.title} loading="lazy" allowFullScreen />
        </div>
      )}
    </div>
  );
}
