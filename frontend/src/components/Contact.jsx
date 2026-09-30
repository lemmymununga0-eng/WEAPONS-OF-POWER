import { useEffect, useState } from "react";
import { submitContact } from "../api/client.js";

export default function Contact({ info, prefillMessage = "" }) {
  const [form, setForm] = useState({ name: "", contact_info: "", message: prefillMessage });
  const [status, setStatus] = useState(null); // "sending" | "ok" | "error"
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (prefillMessage) setForm((f) => (f.message ? f : { ...f, message: prefillMessage }));
  }, [prefillMessage]);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if (!form.contact_info.trim()) errs.contact_info = "Please enter a phone number or email.";
    if (!form.message.trim()) errs.message = "Please enter a message.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    try {
      await submitContact(form);
      setForm({ name: "", contact_info: "", message: "" });
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  const hasAnyContact = info?.phone || info?.whatsapp || info?.email || info?.facebook;
  const digitsOnly = (info?.phone || "").replace(/[^\d+]/g, "");
  const waNumber = (info?.whatsapp || "").replace(/[^\d]/g, "");

  return (
    <section id="contact" className="section alt">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">We'd love to hear from you</span>
          <h2>Contact &amp; Location</h2>
        </div>
        <div className="contact-grid">
          <div className="contact-info">
            <div className="row">
              <b>Address</b>
              <span>{info?.location}</span>
            </div>
            {info?.phone && (
              <div className="row">
                <b>Phone</b>
                <a href={`tel:${digitsOnly}`}>{info.phone}</a>
              </div>
            )}
            {info?.whatsapp && (
              <div className="row">
                <b>WhatsApp</b>
                <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">
                  {info.whatsapp}
                </a>
              </div>
            )}
            {info?.email && (
              <div className="row">
                <b>Email</b>
                <a href={`mailto:${info.email}`}>{info.email}</a>
              </div>
            )}
            {info?.facebook && (
              <div className="row">
                <b>Facebook</b>
                <span>{info.facebook}</span>
              </div>
            )}
            {!hasAnyContact && (
              <p className="empty-note">
                Phone/WhatsApp/email/social links will appear here once added via the admin dashboard.
              </p>
            )}
            <div className="map-placeholder">
              Map pin goes here once the headquarters' coordinates are confirmed.
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" value={form.name} onChange={update("name")} aria-invalid={!!fieldErrors.name} />
              {fieldErrors.name && <span className="form-status error">{fieldErrors.name}</span>}
            </div>
            <div className="field">
              <label htmlFor="contact_info">Phone or email</label>
              <input
                id="contact_info"
                value={form.contact_info}
                onChange={update("contact_info")}
                aria-invalid={!!fieldErrors.contact_info}
              />
              {fieldErrors.contact_info && <span className="form-status error">{fieldErrors.contact_info}</span>}
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={form.message}
                onChange={update("message")}
                aria-invalid={!!fieldErrors.message}
              />
              {fieldErrors.message && <span className="form-status error">{fieldErrors.message}</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
            {status === "ok" && <span className="form-status ok">Thank you — your message has been sent.</span>}
            {status === "error" && (
              <span className="form-status error">Something went wrong. Please try again.</span>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
