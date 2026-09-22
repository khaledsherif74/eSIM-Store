import "./Button.css";

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  icon,
  className,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size}${fullWidth ? " btn-full" : ""}${className ? ` ${className}` : ""}`}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
}
