const MISSING = "Not specified by provider";

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function asText(value) {
  if (value === undefined || value === null || value === "") return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") return null;
  return String(value);
}

function searchText(plan) {
  const description = plan?.description || {};
  const items = Array.isArray(description.items) ? description.items : [];
  const tags = Array.isArray(plan?.tags)
    ? plan.tags
        .map((tag) => (typeof tag === "string" ? tag : tag?.item))
        .filter(Boolean)
    : [];
  return [description.summary, description.heading, ...items, ...tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

export function capabilityDetails(plan) {
  const text = searchText(plan);

  const data =
    plan?.dataLimit != null
      ? `${plan.dataLimit} ${plan.dataUnit || "GB"}`
      : firstDefined(asText(plan?.data), asText(plan?.dataAllowance), MISSING);

  const explicitCalls = firstDefined(
    asText(plan?.calls),
    asText(plan?.voice),
    asText(plan?.voiceCalls),
    asText(plan?.minutes),
    asText(plan?.calling),
  );
  const explicitSms = firstDefined(
    asText(plan?.sms),
    asText(plan?.textMessages),
    asText(plan?.messages),
  );

  let calls = explicitCalls;
  let sms = explicitSms;

  if (!calls) {
    if (includesAny(text, ["unlimited calls", "unlimited voice"]))
      calls = "Unlimited";
    else if (includesAny(text, ["minutes", "mins", "voice"]))
      calls = "Included — see plan description";
    else if (includesAny(text, ["data-only", "data only"]))
      calls = "Not included";
    else calls = MISSING;
  }

  if (!sms) {
    if (
      includesAny(text, [
        "unlimited sms",
        "unlimited texts",
        "unlimited messages",
      ])
    )
      sms = "Unlimited";
    else if (includesAny(text, ["sms", "text messages", "texting"]))
      sms = "Included — see plan description";
    else if (includesAny(text, ["data-only", "data only"]))
      sms = "Not included";
    else sms = MISSING;
  }

  const phoneNumber = firstDefined(
    asText(plan?.phoneNumber),
    asText(plan?.phone_number),
  );

  return {
    data,
    calls,
    sms,
    phoneNumber:
      phoneNumber ||
      (includesAny(text, ["phone number", "telephone number"])
        ? "Provided — see plan details"
        : MISSING),
  };
}

export function operationalDetails(plan) {
  const text = searchText(plan);
  const networks = firstDefined(
    asText(plan?.network),
    Array.isArray(plan?.networks) ? plan.networks : null,
    asText(plan?.supportedNetworks),
    asText(plan?.supported_networks),
  );

  const hotspotRaw = firstDefined(
    plan?.hotspot,
    plan?.hotspotAvailable,
    plan?.tethering,
    plan?.tetheringAllowed,
  );
  let hotspot = asText(hotspotRaw);
  if (!hotspot) {
    if (
      includesAny(text, [
        "hotspot is supported",
        "hotspot available",
        "hotspot supported",
        "tethering supported",
      ])
    )
      hotspot = "Available";
    else if (
      includesAny(text, [
        "hotspot not supported",
        "hotspot unavailable",
        "tethering not supported",
      ])
    )
      hotspot = "Not available";
    else hotspot = MISSING;
  }

  const speed =
    firstDefined(
      asText(plan?.speed),
      asText(plan?.networkSpeed),
      asText(plan?.maxSpeed),
    ) ||
    (includesAny(text, ["unlimited speed", "full speed", "full data speed"])
      ? "Full speed"
      : MISSING);

  const activationPolicy =
    firstDefined(
      asText(plan?.activationPolicy),
      asText(plan?.activation_policy),
      asText(plan?.activationType),
    ) ||
    (includesAny(text, [
      "activates upon esim installation",
      "activate upon installation",
    ])
      ? "Activates upon eSIM installation"
      : MISSING);

  const ipRouting =
    firstDefined(asText(plan?.ipRouting), asText(plan?.ip_routing)) || MISSING;
  const usageTracking =
    firstDefined(asText(plan?.usageTracking), asText(plan?.usage_tracking)) ||
    MISSING;
  const topUp =
    firstDefined(
      asText(plan?.topUp),
      asText(plan?.topup),
      asText(plan?.rechargeable),
    ) || MISSING;

  const policyNotes = Array.isArray(plan?.description?.items)
    ? plan.description.items.filter(Boolean)
    : [];

  return {
    networks,
    hotspot,
    speed,
    activationPolicy,
    ipRouting,
    usageTracking,
    topUp,
    policyNotes,
  };
}

export function destinationNetworks(plan) {
  const raw = firstDefined(
    plan?.destinations,
    plan?.destinationNetworks,
    plan?.networksByCountry,
    plan?.coverageDetails,
  );
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string")
          return { country: null, networks: [item] };
        return {
          country: item?.country || item?.countryCode || item?.code || null,
          networks: Array.isArray(item?.networks)
            ? item.networks.filter(Boolean)
            : [item?.network, item?.operator].filter(Boolean),
        };
      })
      .filter((item) => item.networks.length || item.country);
  }

  if (typeof raw === "object") {
    return Object.entries(raw).map(([country, networks]) => ({
      country,
      networks: Array.isArray(networks)
        ? networks.filter(Boolean)
        : [String(networks)],
    }));
  }

  return [];
}
export function packageType(plan) {
  const regionsText = (
    Array.isArray(plan?.regions) ? plan.regions.join(" ") : ""
  ).toLowerCase();
  if (/global|worldwide|world/.test(regionsText)) return "global";
  const count = Array.isArray(plan?.countries) ? plan.countries.length : 0;
  if (count >= 30) return "global";
  if (count > 1) return "regional";
  return "local";
}
