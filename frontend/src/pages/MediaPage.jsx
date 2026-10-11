import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMedia, mediaUrl } from "../api/client.js";
import { PageHead, SkeletonCards } from "../components/common/Skeleton.jsx";
import { toEmbedUrl } from "../lib/embedUrl.js";
import { useLiveStatus } from "../hooks/useLiveStatus.js";

const TABS = [
  ["video", "Videos"],
  ["photo", "Photos"],
  ["live", "Livestream"],
];

function MediaGrid({ kind }) {
  const [items, setItems] = useState(undefined);
  const [category, setCategory] = useState("");
  useEffect(() => {
    setItems(undefined);
    setCategory("");
    getMedia(kind)
      .then(setItems)
      .catch(() => setItems([]));
  }, [kind]);
  if (items === undefined) return <SkeletonCards count={3} />;
  if (items.length === 0) return <p className="empty-note">{kind === "video" ? "No videos yet." : "No photos yet."}</p>;
  const cats = [...new Set(items.map((i) => i.category).filter(Boolean))];
  const shown = category ? items.filter((i) => i.category === category) : items;
  return (
    <>
      {cats.length > 0 && (
        <div className="province-chips">
          <button type="button" className={`chip ${!category ? "active" : ""}`} onClick={() => setCategory("")}>
            All
          </button>
          {cats.map((c) => (
            <button key={c} type="button" className={`chip ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="card-grid">
        {shown.map((i) => (
          <article className="card" key={i.id}>
            {kind === "photo" ? (
              <img className="card-img" src={mediaUrl(i.file_path || i.url)} alt={i.title} loading="lazy" />
            ) : (
              <div className="sermon-embed-wrap">
                <iframe src={toEmbedUrl(i.url)} title={i.title} loading="lazy" allowFullScreen />
              </div>
            )}
            <div className="card-body">
              <h3>{i.title}</h3>
              {i.category && <span className="card-meta">{i.category}</span>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function LiveTab() {
  const live = useLiveStatus();
  return (
    <div className="panel-card">
      <h3>Livestream</h3>
      <p>{live?.is_live ? `Live now: ${live.title}` : "Watch our services live on YouTube and Facebook."}</p>
      <Link className="btn btn-primary" to="/live">
        Go to the live page
      </Link>
    </div>
  );
}

export default function MediaPage() {
  const [tab, setTab] = useState("video");
  return (
    <section className="section">
      <div className="container">
        <PageHead eyebrow="Watch and see" title="Media" />
        <div className="province-chips" role="tablist" aria-label="Media type">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`chip ${tab === key ? "active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "live" ? <LiveTab /> : <MediaGrid kind={tab} />}
      </div>
    </section>
  );
}
