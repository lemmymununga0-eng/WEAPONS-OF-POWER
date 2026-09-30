import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBranch, getClusters, mediaUrl } from "../api/client.js";
import { callLink, whatsappLink, mailtoLink } from "../lib/phone.js";

const BranchMap = lazy(() => import("../components/locations/BranchMap.jsx"));

export default function BranchDetailPage() {
  const { slug } = useParams();
  const [branch, setBranch] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [error, setError] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);

  useEffect(() => {
    setBranch(null);
    setError(null);
    getBranch(slug)
      .then(setBranch)
      .catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    if (!branch?.cluster_id) {
      setCluster(null);
      return;
    }
    getClusters().then((list) => setCluster(list.find((c) => c.id === branch.cluster_id) || null));
  }, [branch]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: branch.name, url });
      } catch {
        /* user cancelled the share sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied.");
      } catch {
        setShareStatus("Couldn't copy the link — copy it from the address bar.");
      }
      setTimeout(() => setShareStatus(null), 2500);
    }
  };

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <p>
            Branch not found. <Link to="/locations">Back to Locations</Link>.
          </p>
        </div>
      </section>
    );
  }
  if (!branch) {
    return (
      <section className="section">
        <div className="container">Loading…</div>
      </section>
    );
  }

  const showContacts = branch.show_pastor_contacts;
  const hasCoords = branch.latitude != null && branch.longitude != null;
  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`
    : null;

  return (
    <section className="section branch-detail">
      <div className="container">
        {branch.branch_photo && (
          <img className="branch-detail-photo" src={mediaUrl(branch.branch_photo)} alt={branch.name} />
        )}

        <div className="section-head">
          <span className="eyebrow">{branch.is_headquarters ? "Headquarters" : "Branch"}</span>
          <h2>{branch.name}</h2>
        </div>

        <div className="branch-detail-grid">
          <div className="branch-detail-main">
            <div className="twocol founder" style={{ marginBottom: 24 }}>
              <div className="media">
                {branch.pastor_photo ? (
                  <img src={mediaUrl(branch.pastor_photo)} alt={branch.pastor_name} />
                ) : (
                  <div className="placeholder avatar-initials-lg">{branch.pastor_name.charAt(0)}</div>
                )}
              </div>
              <div className="text">
                <span className="name">{branch.pastor_name}</span>
                <span className="title">{branch.pastor_title}</span>
              </div>
            </div>

            <div className="contact-info">
              <div className="row">
                <b>Address</b>
                <span>{branch.address || "Not set yet"}</span>
              </div>
              {branch.directions_note && (
                <div className="row">
                  <b>Notes</b>
                  <span>{branch.directions_note}</span>
                </div>
              )}
              <div className="row">
                <b>Town</b>
                <span>{[branch.town, branch.province || branch.country].filter(Boolean).join(", ")}</span>
              </div>
              {branch.service_times && (
                <div className="row">
                  <b>Services</b>
                  <span style={{ whiteSpace: "pre-line" }}>{branch.service_times}</span>
                </div>
              )}
              {cluster && (
                <div className="row">
                  <b>Cluster</b>
                  <span>
                    {cluster.name}
                    {cluster.overseer_name ? ` — Overseer: ${cluster.overseer_name}` : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="branch-card-actions" style={{ marginTop: 16 }}>
              {showContacts && branch.pastor_phone && (
                <a href={callLink(branch.pastor_phone)} className="btn-chip">
                  Call
                </a>
              )}
              {showContacts && branch.pastor_whatsapp && (
                <a href={whatsappLink(branch.pastor_whatsapp)} target="_blank" rel="noreferrer" className="btn-chip">
                  WhatsApp
                </a>
              )}
              {showContacts && branch.pastor_email && (
                <a href={mailtoLink(branch.pastor_email)} className="btn-chip">
                  Email
                </a>
              )}
              {directionsHref && (
                <a href={directionsHref} target="_blank" rel="noreferrer" className="btn-chip">
                  Directions
                </a>
              )}
              <button type="button" className="btn-chip" onClick={handleShare}>
                Share this branch
              </button>
              {shareStatus && <span className="form-status ok">{shareStatus}</span>}
            </div>
          </div>

          <div className="branch-detail-map">
            {hasCoords ? (
              <Suspense fallback={<div className="map-loading">Loading map…</div>}>
                <BranchMap
                  branches={[branch]}
                  flyTarget={{ center: [branch.latitude, branch.longitude], zoom: 13, key: branch.id }}
                />
              </Suspense>
            ) : (
              <div className="map-placeholder">Map pin not added yet.</div>
            )}
          </div>
        </div>

        <p style={{ marginTop: 24 }}>
          <Link to="/locations">← Back to all locations</Link>
        </p>
      </div>
    </section>
  );
}
