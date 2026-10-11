import { useState } from "react";
import { submitPrayerRequest } from "../api/client.js";
import { PageHead } from "../components/common/Skeleton.jsx";

const CATEGORIES = ["Family", "Health", "Work", "Spiritual", "Financial", "Other"];
const EMPTY = { name: "", email: "", phone: "", request: "", category: "Other", confidential: false };

export default function PrayerPage() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.request.trim()) errs.request = "Please write your prayer request.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "That email address doesn't look right.";
    if (form.phone && form.phone.replace(/\D/g, "").length < 7) errs.phone = "That phone number looks too short.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("sending");
    try {
      await submitPrayerRequest(form);
      setForm(EMPTY);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  if (status === "ok")
    return (
      <section className="section">
        <div className="container narrow">
          <div className="panel-card" role="status">
            <h2>We've received your request</h2>
            <p>Thank you for trusting us. Our prayer team will pray with you. Requests are never shown publicly.</p>
            <button type="button" className="btn btn-outline on-light" onClick={() => setStatus("idle")}>
              Send another
            </button>
          </div>
        </div>
      </section>
    );

  return (
    <section className="section">
      <div className="container narrow">
        <PageHead eyebrow="We stand with you" title="Prayer Request">
          <p>Share what's on your heart. Nothing you write here is ever shown publicly.</p>
        </PageHead>
        <form className="contact-form" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="p-name">Name (optional)</label>
            <input id="p-name" value={form.name} onChange={set("name")} />
          </div>
          <div className="field">
            <label htmlFor="p-email">Email (optional)</label>
            <input id="p-email" type="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
            {errors.email && <span className="form-status error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-phone">Phone (optional)</label>
            <input id="p-phone" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
            {errors.phone && <span className="form-status error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-category">Category</label>
            <select id="p-category" value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-request">Prayer request</label>
            <textarea id="p-request" value={form.request} onChange={set("request")} aria-invalid={!!errors.request} />
            {errors.request && <span className="form-status error">{errors.request}</span>}
          </div>
          <label className="checkbox-inline" style={{ fontSize: 14 }}>
            <input type="checkbox" checked={form.confidential} onChange={set("confidential")} /> Keep this confidential (only the
            prayer team sees it)
          </label>
          <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Submit Prayer Request"}
          </button>
          {status === "error" && <span className="form-status error">Something went wrong. Please try again.</span>}
        </form>
      </div>
    </section>
  );
}
