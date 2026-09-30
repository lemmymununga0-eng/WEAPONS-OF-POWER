import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSermons } from "../api/client.js";
import { sermonMediaKind } from "../lib/mediaKind.js";
import SermonCard from "../components/sermons/SermonCard.jsx";

const PAGE_SIZE = 12;

export default function SermonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const q = searchParams.get("q") || "";
  const kind = searchParams.get("kind") || "all";
  const category = searchParams.get("category") || "";

  useEffect(() => {
    getSermons()
      .then((list) => {
        setSermons(list);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
    setVisibleCount(PAGE_SIZE);
  };

  const categories = useMemo(() => [...new Set(sermons.map((s) => s.category).filter(Boolean))].sort(), [sermons]);

  const filtered = useMemo(() => {
    return sermons.filter((s) => {
      if (kind !== "all" && sermonMediaKind(s) !== kind) return false;
      if (category && s.category !== category) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${s.title} ${s.speaker} ${s.scripture}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [sermons, q, kind, category]);

  const visible = filtered.slice(0, visibleCount);

  if (loading) {
    return (
      <section className="section">
        <div className="container">Loading…</div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p>Couldn't load sermons ({error}).</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Recent messages</span>
          <h2>Sermons</h2>
        </div>

        <div className="locations-filters">
          <input
            type="search"
            placeholder="Search title, speaker or scripture"
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />
        </div>

        <div className="province-chips">
          <button type="button" className={`chip ${kind === "all" ? "active" : ""}`} onClick={() => updateParam("kind", "all")}>
            All
          </button>
          <button type="button" className={`chip ${kind === "audio" ? "active" : ""}`} onClick={() => updateParam("kind", "audio")}>
            Audio
          </button>
          <button type="button" className={`chip ${kind === "video" ? "active" : ""}`} onClick={() => updateParam("kind", "video")}>
            Video
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={`chip ${category === c ? "active" : ""}`}
              onClick={() => updateParam("category", category === c ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 && <p className="empty-note">No sermons match those filters yet.</p>}

        <div className="sermon-grid">
          {visible.map((s) => (
            <SermonCard key={s.id} sermon={s} />
          ))}
        </div>

        {visibleCount < filtered.length && (
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <button type="button" className="btn btn-outline on-light" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Load more
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
