import { useState } from "react";

const METHODS = [
  { key: "airtel", label: "Airtel Money", numberField: "airtel_number", nameField: "airtel_name" },
  { key: "mtn", label: "MTN MoMo", numberField: "mtn_number", nameField: "mtn_name" },
  { key: "zamtel", label: "Zamtel Kwacha", numberField: "zamtel_number", nameField: "zamtel_name" },
];

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — nothing to fall back to, button just won't confirm */
    }
  };

  return (
    <button type="button" className="btn-chip" onClick={copy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function Give({ info }) {
  const methods = METHODS.filter((m) => info?.[m.numberField]);
  const hasBank = info?.bank_name || info?.bank_account_number;
  const hasAnyGivingInfo = info?.give_details || methods.length > 0 || hasBank;

  return (
    <section id="give" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Sow into the vision</span>
          <h2>Give</h2>
        </div>

        {info?.give_details && (
          <div className="give-card" style={{ marginBottom: methods.length || hasBank ? 18 : 0 }}>
            <p>{info.give_details}</p>
          </div>
        )}

        {(methods.length > 0 || hasBank) && (
          <div className="give-methods">
            {methods.map((m) => (
              <div className="give-method-row" key={m.key}>
                <div>
                  <b>{m.label}</b>
                  <span className="give-method-detail">
                    {info[m.numberField]}
                    {info[m.nameField] && ` · ${info[m.nameField]}`}
                  </span>
                </div>
                <CopyButton value={info[m.numberField]} />
              </div>
            ))}
            {hasBank && (
              <div className="give-method-row">
                <div>
                  <b>{info.bank_name || "Bank transfer"}</b>
                  <span className="give-method-detail">
                    {info.bank_account_name && `${info.bank_account_name} · `}
                    {info.bank_account_number}
                    {info.bank_branch && ` · ${info.bank_branch}`}
                  </span>
                </div>
                {info.bank_account_number && <CopyButton value={info.bank_account_number} />}
              </div>
            )}
          </div>
        )}

        {!hasAnyGivingInfo && (
          <p className="empty-note">Giving details will appear here once added via the admin dashboard.</p>
        )}

        {(methods.length > 0 || hasBank) && (
          <p className="empty-note" style={{ marginTop: 14 }}>
            Amounts are in Zambian kwacha (ZMW / K).
          </p>
        )}
      </div>
    </section>
  );
}
