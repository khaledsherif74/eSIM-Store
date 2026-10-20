export const toList = (s) =>
  String(s || "")
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

export const fromList = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export function cairoDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(
    new Date(iso),
  );
}
