import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ZAMBIA_CENTER = [-13.1, 27.8];

function pinIcon() {
  return L.divIcon({
    className: "branch-pin",
    html: '<span style="display:block;width:28px;height:28px;border-radius:50% 50% 50% 0;background:#1f8423;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function ClickHandler({ onChange }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ lat, lng, onChange }) {
  const hasPin = lat != null && lng != null;
  const position = useMemo(() => (hasPin ? [lat, lng] : ZAMBIA_CENTER), [hasPin, lat, lng]);

  return (
    <div className="map-picker-wrap">
      <MapContainer center={position} zoom={hasPin ? 12 : 6} className="map-picker">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {hasPin && (
          <Marker
            position={position}
            icon={pinIcon()}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const { lat: newLat, lng: newLng } = e.target.getLatLng();
                onChange(newLat, newLng);
              },
            }}
          />
        )}
      </MapContainer>
      <p className="map-picker-hint">Click the map to drop a pin, or drag the pin to adjust it.</p>
    </div>
  );
}
