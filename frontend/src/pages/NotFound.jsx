import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section not-found-section">
      <div className="container">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
      </div>
    </section>
  );
}
