import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { mediaUrl } from "../api/client.js";

const VIDEO_SRC = "/videos/home-hero.mp4";

// Visitors who asked for less motion or less data get the still hero instead.
function shouldPlayVideo() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (navigator.connection?.saveData) return false;
  } catch {
    /* fall through to playing */
  }
  return true;
}

export default function Hero({ info }) {
  const videoRef = useRef(null);
  const [playVideo] = useState(shouldPlayVideo);
  const [paused, setPaused] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const showVideo = playVideo && !videoFailed;
  const style =
    !showVideo && info?.church_photo
      ? {
          backgroundImage: `linear-gradient(rgba(27,36,52,.82), rgba(27,36,52,.9)), url(${mediaUrl(info.church_photo)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => setPaused(true));
  }, [paused]);

  return (
    <header id="top" className={`hero ${showVideo ? "hero-video" : ""}`} style={style}>
      {showVideo && (
        <>
          <video
            ref={videoRef}
            className="hero-video-el"
            src={VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            onError={() => setVideoFailed(true)}
          />
          <div className="hero-video-shade" aria-hidden="true" />
        </>
      )}
      <div className="container hero-content">
        <span className="eyebrow">Welcome home</span>
        <h1>{info?.name || "Weapons of Power Ministry International"}</h1>
        <p className="lede">Join us in worship, prayer, and the Word.</p>
        <div className="actions">
          <a href="#services" className="btn btn-primary">
            Join Us
          </a>
          <Link to="/sermons" className="btn btn-outline">
            Watch Sermons
          </Link>
        </div>
      </div>
      {showVideo && (
        <button
          type="button"
          className="hero-video-toggle"
          aria-pressed={paused}
          aria-label={paused ? "Play background video" : "Pause background video"}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "▶" : "❚❚"}
        </button>
      )}
    </header>
  );
}
