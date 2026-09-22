import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.jsx";

export function NotFoundPage() {
  return (
    <div className="container" style={{ padding: "80px 0", textAlign: "center" }}>
      <h1>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)", margin: "12px 0 24px" }}>
        That page doesn't exist. Let's get you back on track.
      </p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
