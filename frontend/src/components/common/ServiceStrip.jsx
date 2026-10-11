import { nextServiceId, dayOrder } from "../../lib/serviceTimes.js";

export function sortServices(list) {
  return [...(list || [])].sort(
    (a, b) => dayOrder(a.day) - dayOrder(b.day) || a.start_time.localeCompare(b.start_time)
  );
}

export default function ServiceStrip({ services }) {
  const sorted = sortServices(services);
  const nextId = nextServiceId(sorted);
  if (sorted.length === 0) return null;
  return (
    <section id="services" className="service-strip" aria-label="Service times">
      <div className="container strip-scroll">
        {sorted.map((s) => (
          <div className={`strip-card ${s.id === nextId ? "next" : ""}`} key={s.id}>
            <span className="strip-day">
              {s.day}
              {s.id === nextId && <em> · Next</em>}
            </span>
            <b>{s.label}</b>
            <span className="strip-time">
              {s.start_time} – {s.end_time}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
