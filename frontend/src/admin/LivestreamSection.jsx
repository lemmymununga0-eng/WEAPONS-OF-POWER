import { useEffect, useState } from "react";
import { getLivestreamSettings, updateLivestreamSettings, getLiveStatus } from "../api/client.js";
import { formatNextService } from "../lib/liveFormat.js";

export default function LivestreamSection({ token, onNotice }) {
  const [form, setForm] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const reload = () => {
    getLivestreamSettings(token).then(setForm);
    getLiveStatus().then(setPreview);
  };

  useEffect(reload, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setBool = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLivestreamSettings(token, {
        youtube_url: form.youtube_url,
        facebook_url: form.facebook_url,
        auto_live: form.auto_live,
        manual_live: form.manual_live,
        manual_title: form.manual_title,
      });
      onNotice("Livestream settings saved.");
      reload();
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <div className="admin-card">
      <h2>Livestream</h2>
      <form className="admin-form-grid" onSubmit={save}>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ls-youtube">YouTube link</label>
          <input
            id="ls-youtube"
            value={form.youtube_url}
            onChange={set("youtube_url")}
            placeholder="https://youtube.com/watch?v=... or youtu.be/..."
          />
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor="ls-facebook">Facebook link</label>
          <input
            id="ls-facebook"
            value={form.facebook_url}
            onChange={set("facebook_url")}
            placeholder="https://facebook.com/.../videos/..."
          />
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={form.auto_live} onChange={setBool("auto_live")} /> Automatically go live
            during scheduled service times
          </label>
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={form.manual_live} onChange={setBool("manual_live")} /> Manual override —
            live right now
          </label>
        </div>
        {form.manual_live && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="ls-manual-title">Manual title (shown while the override is on)</label>
            <input
              id="ls-manual-title"
              value={form.manual_title}
              onChange={set("manual_title")}
              placeholder="e.g. Special Crusade Night"
            />
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Livestream Settings"}
          </button>
        </div>
      </form>

      {preview && (
        <div style={{ marginTop: 20 }}>
          <span className="eyebrow">How the site's button looks right now</span>
          <div style={{ marginTop: 10 }}>
            <span className={`nav-live-btn ${preview.is_live ? "is-live" : ""}`} style={{ display: "inline-flex" }}>
              {preview.is_live
                ? `Live now: ${preview.title}`
                : preview.next_service
                  ? `Next service: ${formatNextService(preview.next_service)}`
                  : "Watch Live"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
