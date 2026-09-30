// Mirrors backend/app/livestream_logic.py's embed-URL conversion, for
// sermon external links (YouTube/Facebook), which the backend stores
// as-is and doesn't convert server-side.
const YOUTUBE_PATTERNS = [
  /youtu\.be\/([A-Za-z0-9_-]+)/,
  /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/,
  /youtube\.com\/live\/([A-Za-z0-9_-]+)/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]+)/,
];

export function toEmbedUrl(url) {
  if (!url) return "";

  for (const pattern of YOUTUBE_PATTERNS) {
    const m = url.match(pattern);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }

  if (/facebook\.com/.test(url)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  }

  return "";
}
