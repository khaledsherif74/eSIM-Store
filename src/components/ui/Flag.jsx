import { flagEmoji, flagImageUrl } from "../../utils/countries.js";

export function Flag({ code, size = 16 }) {
  const url = flagImageUrl(code);
  if (!url) return null;
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
