import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import Hero from "../components/Hero.jsx";
import AboutChurch from "../components/AboutChurch.jsx";
import AboutFounder from "../components/AboutFounder.jsx";
import Ministries from "../components/Ministries.jsx";
import Events from "../components/Events.jsx";
import Give from "../components/Give.jsx";
import Contact from "../components/Contact.jsx";
import { getBranches } from "../api/client.js";

export default function Home() {
  const { info, ministries, events } = useOutletContext();
  const [branches, setBranches] = useState(null);
  const location = useLocation();
  const prefillMessage = location.state?.prefillMessage || "";

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  const provinceCount = branches
    ? new Set(branches.filter((b) => b.province).map((b) => b.province)).size
    : 0;

  return (
    <>
      <Hero info={info} />
      <AboutChurch info={info} />
      <AboutFounder info={info} />
      <Ministries ministries={ministries} />
      <Events info={info} events={events} />

      <section className="section teaser-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Recent messages</span>
            <h2>Latest Sermons</h2>
          </div>
          <p className="empty-note">
            The sermons library is coming soon. <Link to="/sermons">Visit the Sermons page</Link>.
          </p>
        </div>
      </section>

      <section className="section alt teaser-section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Find us near you</span>
            <h2>Our Branches</h2>
          </div>
          {branches && branches.length > 0 ? (
            <p>
              {branches.length} {branches.length === 1 ? "branch" : "branches"}
              {provinceCount > 0 ? ` across ${provinceCount} ${provinceCount === 1 ? "province" : "provinces"}` : ""}.{" "}
              <Link to="/locations">Find a location near you</Link>.
            </p>
          ) : (
            <p className="empty-note">
              Branch locations coming soon. <Link to="/locations">Find a Location</Link>.
            </p>
          )}
        </div>
      </section>

      <Give info={info} />
      <Contact info={info} prefillMessage={prefillMessage} />
    </>
  );
}
