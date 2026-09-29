import { useState } from "react";
import { submitContact } from "../api/client.js";
import Logo from "./Logo.jsx";

export default function ContactFooter({ info }) {
  const [form, setForm] = useState({ name: "", contact_info: "", message: "" });
  const [status, setStatus] = useState(null); // "sending" | "ok" | "error"

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <>
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
                  <span>{info.phone}</span>
                </div>
              )}
              {info?.whatsapp && (
                <div className="row">
                  <b>WhatsApp</b>
                  <span>{info.whatsapp}</span>
                </div>
              )}
              {info?.email && (
                <div className="row">
                  <b>Email</b>
                  <span>{info.email}</span>
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
                Map embed goes here once the exact address/coordinates are confirmed.
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" required value={form.name} onChange={update("name")} />
              </div>
              <div className="field">
                <label htmlFor="contact_info">Phone or email</label>
                <input id="contact_info" required value={form.contact_info} onChange={update("contact_info")} />
              </div>
              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea id="message" required value={form.message} onChange={update("message")} />
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

      <footer className="site-footer">
        <div className="container">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={26} />
            <span>{info?.name}</span>
          </div>
          <span>
            © {new Date().getFullYear()} {info?.name}. All rights reserved.
          </span>
        </div>
      </footer>
    </>
  );
}
