import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mediaUrl } from "../../api/client.js";

const ZAMBIA_CENTER = [-13.1, 27.8];
const ZAMBIA_ZOOM = 6;
const TILE_ERROR_THRESHOLD = 6;

function branchIcon(branch) {
  const isHQ = branch.is_headquarters;
  const size = isHQ ? 34 : 26;
  const color = isHQ ? "#1f8423" : "#1b2434";
  return L.divIcon({
    className: "branch-pin",
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 0.6 });
  }, [target, map]);
  return null;
}

export default function BranchMap({ branches, onSelect, flyTarget, onTilesFailed }) {
  const [active, setActive] = useState(false);
  const [tileErrors, setTileErrors] = useState(0);

  const markers = useMemo(
    () => branches.filter((b) => b.latitude != null && b.longitude != null),
    [branches]
  );

  useEffect(() => {
    if (tileErrors >= TILE_ERROR_THRESHOLD) onTilesFailed?.();
  }, [tileErrors, onTilesFailed]);

  return (
    <div className="branch-map-wrap">
      {!active && (
        <button type="button" className="map-tap-overlay" onClick={() => setActive(true)}>
          Tap to interact with the map
        </button>
      )}
      <MapContainer
        center={ZAMBIA_CENTER}
        zoom={ZAMBIA_ZOOM}
        scrollWheelZoom={active}
        dragging={active}
        touchZoom={active}
        doubleClickZoom={active}
        className="branch-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{ tileerror: () => setTileErrors((n) => n + 1) }}
        />
        <FlyTo target={flyTarget} />
        <MarkerClusterGroup chunkedLoading>
          {markers.map((b) => (
            <Marker
              key={b.id}
              position={[b.latitude, b.longitude]}
              icon={branchIcon(b)}
              eventHandlers={{ click: () => onSelect?.(b.id) }}
            >
              <Popup>
                <div className="map-popup">
                  {b.pastor_photo ? (
                    <img src={mediaUrl(b.pastor_photo)} alt={b.pastor_name} />
                  ) : (
                    <div className="map-popup-avatar">{b.pastor_name.charAt(0)}</div>
                  )}
                  <b>{b.name}</b>
                  <span>
                    {b.pastor_title} {b.pastor_name}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
