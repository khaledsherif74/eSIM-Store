import "./Badge.css";

export function Badge({ tone = "neutral", children, icon, className = "" }) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      {icon && <span className="badge-icon">{icon}</span>}
      {children}
    </span>
  );
}
