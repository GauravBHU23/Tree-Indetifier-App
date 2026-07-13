interface Props {
  message?: string | null;
  /** True when the cause is the backend being unreachable (vs. explicit maintenance). */
  unreachable?: boolean;
  onRetry: () => void;
  retrying?: boolean;
}

/** Full-screen friendly message shown while the app/backend is unavailable. */
export default function MaintenanceScreen({ message, unreachable, onRetry, retrying }: Props) {
  const title = unreachable ? "Server is waking up 😴" : "Under maintenance 🛠️";
  const body =
    message ||
    (unreachable
      ? "Couldn't reach the server — it may be starting up. Please try again in a moment."
      : "The app is being updated. Please check back in a little while. 🌱");

  return (
    <div className="maintenance">
      <div className="maintenance-emoji">🌳</div>
      <h2>{title}</h2>
      <p>{body}</p>
      <button className="reset-btn" onClick={onRetry} disabled={retrying}>
        {retrying ? "Checking…" : "🔄 Retry"}
      </button>
    </div>
  );
}
