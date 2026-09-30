import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getBranches, getClusters, getProvinces } from "../api/client.js";
import BranchCard from "../components/locations/BranchCard.jsx";
import { distanceKm as haversineKm } from "../lib/geo.js";

const BranchMap = lazy(() => import("../components/locations/BranchMap.jsx"));

const PROVINCE_CENTERS = {
  Central: [-14.5, 28.9],
  Copperbelt: [-12.8, 28.2],
  Eastern: [-13.6, 32.6],
  Luapula: [-10.8, 28.9],
  Lusaka: [-15.4, 28.3],
  Muchinga: [-11.8, 31.8],
  Northern: [-10.2, 31.2],
  "North-Western": [-13.5, 24.9],
  Southern: [-16.6, 27.3],
  Western: [-15.3, 23.1],
};

export default function LocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileView, setMobileView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | asking | granted | denied

  const country = searchParams.get("country") || "";
  const province = searchParams.get("province") || "";
  const clusterId = searchParams.get("cluster_id") || "";
  const q = searchParams.get("q") || "";

  useEffect(() => {
    setLoading(true);
    Promise.all([getBranches(), getClusters(), getProvinces()])
      .then(([b, c, p]) => {
        setBranches(b);
        setClusters(c);
        setProvinces(p);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const countryOptions = useMemo(() => [...new Set(branches.map((b) => b.country))].sort(), [branches]);

  const filtered = useMemo(() => {
    return branches.filter((b) => {
      if (country && b.country !== country) return false;
      if (province && b.province !== province) return false;
      if (clusterId && String(b.cluster_id) !== clusterId) return false;
      if (q) {
        const needle = q.toLowerCase();
        const haystack = `${b.town} ${b.pastor_name} ${b.name}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [branches, country, province, clusterId, q]);

  const withDistance = useMemo(() => {
    if (!userLocation) return filtered.map((b) => ({ branch: b, distance: null }));
    return filtered
      .map((b) => ({
        branch: b,
        distance:
          b.latitude != null && b.longitude != null
            ? haversineKm(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
            : null,
      }))
      .sort((a, b) => {
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
  }, [filtered, userLocation]);

  const provinceCounts = useMemo(() => {
    const counts = {};
    branches.forEach((b) => {
      if (b.country === "Zambia" && b.province) counts[b.province] = (counts[b.province] || 0) + 1;
    });
    return counts;
  }, [branches]);

  useEffect(() => {
    if (!selectedId) return;
    const el = document.getElementById(`branch-card-${selectedId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { timeout: 10000 }
    );
  };

  const jumpToProvince = (prov) => {
    updateParam("province", prov === province ? "" : prov);
    const center = PROVINCE_CENTERS[prov];
    if (center) setFlyTarget({ center, zoom: 8, key: Date.now() });
  };

  if (loading) return <section className="section"><div className="container">Loading…</div></section>;
  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p>Couldn't load branches ({error}).</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section locations-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Find us near you</span>
          <h2>Find a Location</h2>
        </div>

        <div className="locations-filters">
          <select value={country} onChange={(e) => updateParam("country", e.target.value)}>
            <option value="">All countries</option>
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select value={province} onChange={(e) => updateParam("province", e.target.value)}>
            <option value="">All provinces / regions</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select value={clusterId} onChange={(e) => updateParam("cluster_id", e.target.value)}>
            <option value="">All clusters</option>
            {clusters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="Search by town or pastor name"
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
          />

          <button type="button" className="btn btn-outline on-light" onClick={useMyLocation}>
            {geoStatus === "asking" ? "Locating…" : "Use my location"}
          </button>
        </div>

        {geoStatus === "denied" && (
          <p className="empty-note">
            Couldn't get your location — the list below still works, just not sorted by distance.
          </p>
        )}

        {Object.keys(provinceCounts).length > 0 && (
          <div className="province-chips">
            {Object.entries(provinceCounts).map(([prov, count]) => (
              <button
                type="button"
                key={prov}
                className={`chip ${province === prov ? "active" : ""}`}
                onClick={() => jumpToProvince(prov)}
              >
                {prov} ({count})
              </button>
            ))}
          </div>
        )}

        <div className="mobile-view-toggle">
          <button
            type="button"
            className={mobileView === "list" ? "active" : ""}
            onClick={() => setMobileView("list")}
          >
            List
          </button>
          <button type="button" className={mobileView === "map" ? "active" : ""} onClick={() => setMobileView("map")}>
            Map
          </button>
        </div>

        <div className={`locations-layout view-${mobileView}`}>
          <div className="locations-list-pane">
            {withDistance.length === 0 && <p className="empty-note">No branches match those filters yet.</p>}
            {withDistance.map(({ branch, distance }) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                distanceKm={distance}
                selected={selectedId === branch.id}
                onSelect={setSelectedId}
              />
            ))}
          </div>

          <div className="locations-map-pane">
            {tilesFailed && (
              <p className="empty-note map-fallback-note">
                The map couldn't load — the list is still up to date.
              </p>
            )}
            <Suspense fallback={<div className="map-loading">Loading map…</div>}>
              <BranchMap
                branches={filtered}
                onSelect={setSelectedId}
                flyTarget={flyTarget}
                onTilesFailed={() => setTilesFailed(true)}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
