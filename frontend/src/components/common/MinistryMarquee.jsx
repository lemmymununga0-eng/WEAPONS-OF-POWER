import { useState } from "react";
import MinistryCard from "./MinistryCard.jsx";

// Ministry cards that scroll sideways in an endless loop. The list is
// rendered twice (the copy is hidden from keyboards and screen readers) and
// the track slides by exactly one copy, so the loop has no visible jump.
export default function MinistryMarquee({ ministries }) {
  const [paused, setPaused] = useState(false);
  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));
  if (!ministries.length) return null;

  // Make sure one copy is wider than a wide screen, even with few ministries.
  const repeat = Math.max(1, Math.ceil(6 / ministries.length));
  const items = Array.from({ length: repeat }).flatMap((_, r) =>
    ministries.map((m) => ({ key: `${r}-${m.id}`, ministry: m }))
  );
  const seconds = Math.max(24, items.length * 6);

  const group = (hidden) => (
    <div className="marquee-group" aria-hidden={hidden || undefined}>
      {items.map(({ key, ministry }) => (
        <div className="marquee-item" key={key}>
          <MinistryCard ministry={ministry} onToggle={toggle} expanded={openId === ministry.id} tabIndex={hidden ? -1 : undefined} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="marquee-wrap">
      <div className={`marquee ${paused || openId !== null ? "is-paused" : ""}`} role="region" aria-label="Ministries">
        <div className="marquee-track" style={{ animationDuration: `${seconds}s` }}>
          {group(false)}
          {group(true)}
        </div>
      </div>
      <div className="container marquee-toggle">
        <button type="button" className="btn-chip" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? "Play" : "Pause"} scrolling
        </button>
      </div>
    </div>
  );
}
