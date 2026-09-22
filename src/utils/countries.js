const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const nameCache = new Map();

export function countryName(code) {
  if (!code) return "";
  const key = code.toUpperCase();
  if (nameCache.has(key)) return nameCache.get(key);
  let name;
  try {
    name = regionNames.of(key) || code;
  } catch {
    name = code;
  }
  nameCache.set(key, name);
  return name;
}

export function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  const codePoints = [...code.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0),
  );
  return String.fromCodePoint(...codePoints);
}

export function flagImageUrl(code, width = 40) {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

export function buildCountryIndexWithCounts(products) {
  const counts = new Map();
  for (const p of products) {
    for (const c of p.countries || []) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([code, planCount]) => ({
      code,
      name: countryName(code),
      flag: flagEmoji(code),
      flagUrl: flagImageUrl(code),
      planCount,
    }))
    .sort((a, b) => b.planCount - a.planCount);
}

export function buildCountryIndex(products) {
  const set = new Set();
  for (const p of products) {
    for (const c of p.countries || []) set.add(c);
  }
  return [...set]
    .map((code) => ({
      code,
      name: countryName(code),
      flag: flagEmoji(code),
      flagUrl: flagImageUrl(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
