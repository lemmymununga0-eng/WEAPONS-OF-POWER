import { mediaUrl } from "../api/client.js";

export default function AboutChurch({ info }) {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Who we are</span>
          <h2>About the Church</h2>
        </div>
        <div className="twocol">
          <div className="media">
            {info?.church_photo ? (
              <img src={mediaUrl(info.church_photo)} alt={info?.name || "Church"} />
            ) : (
              <div className="placeholder">Church photo goes here — add via admin dashboard</div>
            )}
          </div>
          <div className="text">
            <p>{info?.mission}</p>
            <p>
              We meet at {info?.location}, and every service is an open door — whether
              it's your first visit or your hundredth, there's a seat for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
