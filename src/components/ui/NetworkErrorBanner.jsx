import { WifiOff, ServerCrash } from "lucide-react";
import "./NetworkErrorBanner.css";

const UNREACHABLE_PATTERNS = [
  "failed to fetch",
  "networkerror",
  "load failed",
  "network request failed",
];

export function NetworkErrorBanner({ error }) {
  const isUnreachable =
    !error ||
    UNREACHABLE_PATTERNS.some((p) => String(error).toLowerCase().includes(p));

  if (isUnreachable) {
    return (
      <div className="network-error-banner">
        <WifiOff size={20} />
        <div>
          <strong>Can't reach the server</strong>
          <p>
            The app couldn't connect at all — check your internet connection, or
            if you're developing locally, make sure the backend is running (
            <code>cd server && npm run dev</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="network-error-banner">
      <ServerCrash size={20} />
      <div>
        <strong>Something went wrong</strong>
        <p>
          The server responded with an error. Please try again in a moment.{" "}
          {error ? `Details: ${error}` : ""}
        </p>
      </div>
    </div>
  );
}
