import { mediaUrl } from "../api/client.js";

export default function AboutFounder({ info }) {
  return (
    <section id="founder" className="section alt founder">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Leadership</span>
          <h2>About the Founder</h2>
        </div>
        <div className="twocol">
          <div className="media">
            {info?.founder_photo ? (
              <img src={mediaUrl(info.founder_photo)} alt={info.founder_name} />
            ) : (
              <div className="placeholder">Founder's photo — add via admin dashboard</div>
            )}
          </div>
          <div className="text">
            <span className="name">{info?.founder_name}</span>
            <span className="title">{info?.founder_title}</span>
            <p>{info?.founder_bio}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
