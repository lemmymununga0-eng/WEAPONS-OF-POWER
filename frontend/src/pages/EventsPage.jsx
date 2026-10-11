import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import EventCard from "../components/common/EventCard.jsx";
import { PageHead } from "../components/common/Skeleton.jsx";
import { isUpcoming, eventEnd } from "../lib/eventDates.js";

export default function EventsPage() {
  const { events } = useOutletContext();
  const [tab, setTab] = useState("upcoming");
  const upcoming = events.filter((e) => isUpcoming(e)).sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = events.filter((e) => !isUpcoming(e)).sort((a, b) => eventEnd(b).localeCompare(eventEnd(a)));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <section className="section">
      <div className="container">
        <PageHead eyebrow="What's on" title="Events" />
        <div className="province-chips" role="tablist" aria-label="Event timing">
          {["upcoming", "past"].map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`chip ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "upcoming" ? "Upcoming" : "Past"}
            </button>
          ))}
        </div>
        {list.length === 0 && <p className="empty-note">{tab === "upcoming" ? "No upcoming events." : "No past events."}</p>}
        <div className="card-grid">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </div>
    </section>
  );
}
