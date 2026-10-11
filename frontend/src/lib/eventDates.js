export function todayIso(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function eventEnd(e) {
  return e.end_date || e.event_date;
}

export function isUpcoming(e, today = todayIso()) {
  return eventEnd(e) >= today;
}

export function formatDate(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function formatRange(e) {
  const start = formatDate(e.event_date);
  return e.end_date && e.end_date !== e.event_date ? `${start} – ${formatDate(e.end_date)}` : start;
}
