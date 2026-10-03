import { flagEmoji, flagImageUrl } from "../../utils/countries.js";

export function Flag({ code, size = 16 }) {
  if (!code || code.length !== 2) return null;
  const requestWidth = Math.max(40, Math.ceil(size) * 2);
  const url = flagImageUrl(code, requestWidth);
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      width={size}
      height={size}
      style={{
        borderRadius: "50%",
        objectFit: "cover",
        display: "inline-block",
        verticalAlign: "-2px",
      }}
      onError={(e) => {
        e.currentTarget.replaceWith(
          document.createTextNode(flagEmoji(code) || code),
        );
      }}
    />
  );
}
