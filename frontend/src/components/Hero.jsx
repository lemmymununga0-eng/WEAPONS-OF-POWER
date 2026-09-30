import { Link } from "react-router-dom";
import { useLiveStatus } from "../hooks/useLiveStatus.js";
import { formatNextService } from "../lib/liveFormat.js";

export default function Hero({ info }) {
  const liveStatus = useLiveStatus();

  return (
    <header id="top" className="hero">
      <div className="container">
        <span className="eyebrow">Welcome home</span>
        <h1>{info?.name || "Weapons of Power Ministry International"}</h1>
        <p className="lede">
          A Spirit-filled family of believers under the leadership of{" "}
          {info?.founder_name || "our founder"} — join us in worship, prayer, and the Word.
        </p>
        <div className="actions">
          <Link to="/live" className={`btn btn-primary btn-live ${liveStatus?.is_live ? "is-live" : ""}`}>
            {liveStatus?.is_live
              ? `Live now: ${liveStatus.title}`
              : liveStatus?.next_service
                ? `Next service: ${formatNextService(liveStatus.next_service)}`
                : "Watch Live"}
          </Link>
          <a href="#events" className="btn btn-outline">
            Plan Your Visit
          </a>
        </div>
      </div>
    </header>
  );
}
