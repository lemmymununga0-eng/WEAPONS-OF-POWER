import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import Footer from "../components/Footer.jsx";
import { getChurchInfo, getMinistries, getEvents } from "../api/client.js";
import { PlayerProvider } from "../player/PlayerContext.jsx";
import MiniPlayer from "../player/MiniPlayer.jsx";

export default function PublicLayout() {
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
    <PlayerProvider>
      <Nav churchName={info.name} />
      <Outlet context={{ info, ministries, events }} />
      <Footer info={info} />
      <MiniPlayer />
    </PlayerProvider>
  );
}
