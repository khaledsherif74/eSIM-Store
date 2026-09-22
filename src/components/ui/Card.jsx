import "./Card.css";

export function Card({ as: Tag = "div", padded = true, hoverable = false, className = "", children, ...rest }) {
  return (
    <Tag
      className={`card${padded ? " card-padded" : ""}${hoverable ? " card-hoverable" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
