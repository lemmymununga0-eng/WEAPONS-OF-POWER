export function directionsUrl(address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export default function MapEmbed({ address, title = "Map" }) {
  if (!address) return null;
  return (
    <iframe
      className="map-embed"
      title={title}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
    />
  );
}
