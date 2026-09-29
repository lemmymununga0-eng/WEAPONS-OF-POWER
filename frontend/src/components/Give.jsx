export default function Give({ info }) {
  return (
    <section id="give" className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Sow into the vision</span>
          <h2>Give</h2>
        </div>
        <div className="give-card">
          <p>{info?.give_details}</p>
        </div>
      </div>
    </section>
  );
}
