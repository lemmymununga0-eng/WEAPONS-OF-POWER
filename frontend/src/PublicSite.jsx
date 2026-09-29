import { useEffect, useState } from "react";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import AboutChurch from "./components/AboutChurch.jsx";
import AboutFounder from "./components/AboutFounder.jsx";
import Ministries from "./components/Ministries.jsx";
import Events from "./components/Events.jsx";
import Give from "./components/Give.jsx";
import ContactFooter from "./components/ContactFooter.jsx";
import { getChurchInfo, getMinistries, getEvents } from "./api/client.js";

export default function PublicSite() {
  const [info, setInfo] = useState(null);
  const [ministries, setMinistries] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getChurchInfo(), getMinistries(), getEvents()])
      .then(([infoRes, ministriesRes, eventsRes]) => {
        setInfo(infoRes);
        setMinistries(ministriesRes);
        setEvents(eventsRes);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>
        <p>Couldn't reach the server ({error}).</p>
        <p>Make sure the backend is running at the address in VITE_API_BASE.</p>
      </div>
    );
  }

  if (!info) {
    return <div style={{ padding: 60, textAlign: "center", fontFamily: "sans-serif" }}>Loading…</div>;
  }

  return (
    <>
      <Nav churchName={info.name} />
      <Hero info={info} />
      <AboutChurch info={info} />
      <AboutFounder info={info} />
      <Ministries ministries={ministries} />
      <Events info={info} events={events} />
      <Give info={info} />
      <ContactFooter info={info} />
    </>
  );
}
