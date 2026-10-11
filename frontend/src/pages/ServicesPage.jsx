import { useOutletContext } from "react-router-dom";
import { PageHead } from "../components/common/Skeleton.jsx";
import { sortServices } from "../components/common/ServiceStrip.jsx";
import { nextServiceId } from "../lib/serviceTimes.js";

export default function ServicesPage() {
  const { info } = useOutletContext();
  const services = sortServices(info?.service_times);
  const nextId = nextServiceId(services);
  const byDay = services.reduce((acc, s) => {
    (acc[s.day] = acc[s.day] || []).push(s);
    return acc;
  }, {});

  return (
    <section className="section">
      <div className="container">
        <PageHead eyebrow="Join us" title="Services">
          <p>When to show up. Everyone is welcome.</p>
        </PageHead>
        {services.length === 0 && <p className="empty-note">Service times coming soon.</p>}
        {Object.entries(byDay).map(([day, list]) => (
          <div key={day} className="day-group">
            <h3>{day}</h3>
            <div className="card-grid">
              {list.map((s) => (
                <article className={`panel-card ${s.id === nextId ? "next" : ""}`} key={s.id}>
                  <b>{s.label}</b>
                  <span className="strip-time">
                    {s.start_time} – {s.end_time}
                  </span>
                  {info?.location && <span className="card-meta">{info.location}</span>}
                  {s.id === nextId && <span className="kind-badge">Next</span>}
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
