// The backend always computes live/next-service in Africa/Lusaka time; the
// display must show Lusaka time too, regardless of the visitor's own
// device timezone — Intl's timeZone option handles that conversion.
export function formatNextService(nextService) {
  if (!nextService?.starts_at) return "";
  const date = new Date(nextService.starts_at);
  const day = date.toLocaleString("en-GB", { timeZone: "Africa/Lusaka", weekday: "short" });
  const time = date.toLocaleString("en-GB", {
    timeZone: "Africa/Lusaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} ${time}`;
}

export function msUntil(isoString) {
  return new Date(isoString).getTime() - Date.now();
}

export function formatCountdown(ms) {
  if (ms <= 0) return "starting now";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}
