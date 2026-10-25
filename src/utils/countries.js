const namesCache = new Map();

function namesFor(language) {
  const key = language || "en";
  if (namesCache.has(key)) return namesCache.get(key);
  let regionNames;
  try {
    regionNames = new Intl.DisplayNames([key], { type: "region" });
  } catch {
    regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  }
  namesCache.set(key, regionNames);
  return regionNames;
}

const countryNamesCache = new Map();

export function countryName(code, language = "en") {
  if (!code) return "";
  const up = code.toUpperCase();
  const cacheKey = `${language}:${up}`;
  if (countryNamesCache.has(cacheKey)) return countryNamesCache.get(cacheKey);
  let name;
  try {
    name = namesFor(language).of(up) || code;
  } catch {
    name = code;
  }
  countryNamesCache.set(cacheKey, name);
  return name;
}

export function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  const codePoints = [...code.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0),
  );
  return String.fromCodePoint(...codePoints);
}

export function flagImageUrl(code, width = 80) {
  if (!code || code.length !== 2) return null;
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

export function buildCountryIndexWithCounts(products, language = "en") {
  const counts = new Map();
  for (const p of products) {
    for (const c of p.countries || []) {
      counts.set(c, (counts.get(c) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([code, planCount]) => ({
      code,
      name: countryName(code, language),
      flag: flagEmoji(code),
      flagUrl: flagImageUrl(code),
      planCount,
    }))
    .sort((a, b) => b.planCount - a.planCount);
}

export function buildCountryIndex(products, language = "en") {
  const set = new Set();
  for (const p of products) {
    for (const c of p.countries || []) set.add(c);
  }
  return [...set]
    .map((code) => ({
      code,
      name: countryName(code, language),
      flag: flagEmoji(code),
      flagUrl: flagImageUrl(code),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
