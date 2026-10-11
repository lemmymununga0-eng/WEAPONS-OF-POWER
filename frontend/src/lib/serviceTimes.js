const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function atTime(base, hhmm) {
  const [h, m] = (hhmm || "0:0").split(":").map(Number);
  const d = new Date(base);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

// Returns the id of the service that is happening now or starts soonest.
export function nextServiceId(services, now = new Date()) {
  let best = null;
  for (const s of services || []) {
    const dayIdx = DAYS.indexOf(s.day);
    if (dayIdx < 0) continue;
    const base = new Date(now);
    base.setDate(now.getDate() + ((dayIdx - now.getDay() + 7) % 7));
    let start = atTime(base, s.start_time);
    let end = atTime(base, s.end_time);
    if (end < now) {
      base.setDate(base.getDate() + 7);
      start = atTime(base, s.start_time);
      end = atTime(base, s.end_time);
    }
    if (!best || end < best.end) best = { id: s.id, end };
  }
  return best?.id ?? null;
}

export function dayOrder(day) {
  const i = DAYS.indexOf(day);
  return i < 0 ? 99 : i;
}
