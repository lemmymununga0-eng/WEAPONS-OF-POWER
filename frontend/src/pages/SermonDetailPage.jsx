import { Link, useParams } from "react-router-dom";

export default function SermonDetailPage() {
  const { id } = useParams();
  return (
    <section className="section stub-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Sermon</span>
          <h2>Sermon #{id}</h2>
        </div>
        <p className="empty-note">
          Individual sermon pages are coming soon. <Link to="/sermons">Back to Sermons</Link>.
        </p>
      </div>
    </section>
  );
}
