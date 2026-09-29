export default function Hero({ info }) {
  return (
    <header id="top" className="hero">
      <div className="container">
        <span className="eyebrow">Welcome home</span>
        <h1>{info?.name || "Weapons of Power Ministry International"}</h1>
        <p className="lede">
          A Spirit-filled family of believers under the leadership of{" "}
          {info?.founder_name || "our founder"} — join us in worship, prayer, and the Word.
        </p>
        <div className="actions">
          <a href="#events" className="btn btn-primary">
            Plan Your Visit
          </a>
          <a href="#contact" className="btn btn-outline">
            Get in Touch
          </a>
        </div>
      </div>
    </header>
  );
}
