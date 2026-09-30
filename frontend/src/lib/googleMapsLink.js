// Extracts {lat, lng} from a pasted Google Maps link, or a plain
// "lat,lng" string. Throws an Error with a message safe to show the
// admin directly when it can't.
export function parseGoogleMapsLink(input) {
  const text = (input || "").trim();
  if (!text) {
    throw new Error("Paste a Google Maps link or coordinates first.");
  }

  if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(text)) {
    throw new Error(
      "Shortened Google Maps links can't be read directly — open it, then paste the full address-bar URL, or paste coordinates instead."
    );
  }

  // .../@lat,lng,15z
  let m = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // ...?q=lat,lng or &q=lat,lng
  m = text.match(/[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  // a plain "lat,lng" pasted directly
  m = text.match(/^(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)$/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };

  throw new Error(
    'Couldn\'t find coordinates in that. Paste a full Google Maps link with "@lat,lng" or "?q=lat,lng", or paste "lat,lng" directly.'
  );
}
