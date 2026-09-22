export const CAPABILITY_META = {
  data: { label: "Data", icon: "wifi" },
  calls: { label: "Calls", icon: "phone" },
  sms: { label: "SMS", icon: "message" },
  hotspot: { label: "Hotspot", icon: "hotspot" },
};
export function capabilityLabel(value) { return value === "included" ? "Included" : value === "not_included" ? "Not included" : "Not specified"; }
export function capabilityClass(value) { return value === "included" ? "included" : value === "not_included" ? "not-included" : "unknown"; }
