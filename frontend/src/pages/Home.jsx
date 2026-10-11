import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import ServiceStrip from "../components/common/ServiceStrip.jsx";
import EventCard from "../components/common/EventCard.jsx";
import MinistryMarquee from "../components/common/MinistryMarquee.jsx";
import SermonCard from "../components/sermons/SermonCard.jsx";
import MapEmbed, { directionsUrl } from "../components/common/MapEmbed.jsx";
import { SkeletonCards } from "../components/common/Skeleton.jsx";
import { getSermons, getActiveAnnouncements, mediaUrl } from "../api/client.js";
import { useLiveStatus } from "../hooks/useLiveStatus.js";
import { isUpcoming } from "../lib/eventDates.js";

function AnnouncementBanner() {
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    getActiveAnnouncements()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  if (dismissed || items.length === 0) return null;
  const a = items[0];
  return (
    <div className={`announcement ${a.priority === "high" ? "high" : ""}`} role="status">
      <div className="container announcement-inner">
        <span>
          <b>{a.title}</b>
          {a.body && ` — ${a.body}`}
        </span>
        <button type="button" className="announcement-close" aria-label="Dismiss announcement" onClick={() => setDismissed(true)}>
          ×
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { info, ministries, events } = useOutletContext();
  const [sermon, setSermon] = useState(undefined);
  const live = useLiveStatus();

  useEffect(() => {
    getSermons()
      .then((list) => setSermon(list[0] || null))
      .catch(() => setSermon(null));
  }, []);

  const upcoming = events.filter((e) => isUpcoming(e)).slice(0, 4);
  const paragraphs = (info?.mission || "").split(/\n+/).filter(Boolean).slice(0, 3);
  const photo = info?.founder_photo || info?.church_photo;
  const hasLive = !!(live?.is_live || live?.embed_url);

  return (
    <>
      <AnnouncementBanner />
      <Hero info={info} />
      <ServiceStrip services={info?.service_times} />

      <section className="section">
        <div className="container twocol">
          <div className="media">
            {photo ? (
              <img src={mediaUrl(photo)} alt={info?.founder_name || info?.name} />
            ) : (
              <div className="placeholder">Photo coming soon</div>
            )}
          </div>
          <div className="text">
            <span className="eyebrow">Welcome</span>
            <h2>A home for every generation</h2>
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p>
              <Link to="/about" className="btn-chip">
                Read More
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Latest message</span>
            <h2>Latest Sermon</h2>
          </div>
          {sermon === undefined && <SkeletonCards count={1} />}
          {sermon === null && <p className="empty-note">No sermons available yet. Check back soon for new messages.</p>}
          {sermon && (
            <div className="sermon-grid">
              <SermonCard sermon={sermon} />
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">What's on</span>
            <h2>Upcoming Events</h2>
          </div>
          {upcoming.length === 0 && <p className="empty-note">No upcoming events.</p>}
          <div className="card-grid snap-row">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
          <p style={{ marginTop: 18 }}>
            <Link to="/events">See all events →</Link>
          </p>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Get involved</span>
            <h2>Ministries</h2>
          </div>
          {ministries.length === 0 && <p className="empty-note">No ministries listed yet.</p>}
        </div>
        <MinistryMarquee ministries={ministries} />
        <div className="container">
          <p style={{ marginTop: 18 }}>
            <Link to="/ministries">See all ministries →</Link>
          </p>
        </div>
      </section>

      {hasLive && (
        <section className="cta-band">
          <div className="container cta-inner">
            <div>
              <h3>Join Us Live</h3>
              <p>{live.is_live ? `Live now: ${live.title}` : "Watch our services online."}</p>
            </div>
            <Link to="/live" className="btn btn-primary">
              Watch Live
            </Link>
          </div>
        </section>
      )}

      {info?.location && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">Visit us</span>
              <h2>Location</h2>
              <p>{info.location}</p>
            </div>
            <MapEmbed address={info.location} title="Church location" />
            <p style={{ marginTop: 14 }}>
              <a className="btn btn-outline on-light" href={directionsUrl(info.location)} target="_blank" rel="noreferrer">
                Get Directions
              </a>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
