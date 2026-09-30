import { Link, useParams } from "react-router-dom";

export default function BranchDetailPage() {
  const { slug } = useParams();
  return (
    <section className="section stub-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Branch</span>
          <h2>{slug}</h2>
        </div>
        <p className="empty-note">
          Branch detail pages are coming soon. <Link to="/locations">Back to Locations</Link>.
        </p>
      </div>
    </section>
  );
}
