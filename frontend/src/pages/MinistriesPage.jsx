import { useOutletContext } from "react-router-dom";
import MinistryCard from "../components/common/MinistryCard.jsx";
import { PageHead } from "../components/common/Skeleton.jsx";

export default function MinistriesPage() {
  const { ministries } = useOutletContext();
  return (
    <section className="section">
      <div className="container">
        <PageHead eyebrow="Get involved" title="Ministries">
          <p>Find a place to serve and grow.</p>
        </PageHead>
        {ministries.length === 0 && <p className="empty-note">No ministries listed yet.</p>}
        <div className="card-grid">
          {ministries.map((m) => (
            <MinistryCard key={m.id} ministry={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
