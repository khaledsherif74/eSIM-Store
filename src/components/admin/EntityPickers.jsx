import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../services/adminApi.js";
import { adminApiExtra } from "../../services/adminApiExtra.js";
import "./EntityPickers.css";

const productLabel = (p) =>
  [
    p.title,
    p.providerName,
    p.dataLimit ? `${p.dataLimit}${p.dataUnit || ""}` : null,
    p.validityDays ? `${p.validityDays}d` : null,
  ]
    .filter(Boolean)
    .join(" · ");

function Chips({ items, onRemove, disabled }) {
  const { t } = useTranslation();
  if (!items.length) return null;
  return (
    <div className="ep-chips">
      {items.map((it) => (
        <span className="ep-chip" key={it.value}>
          <span title={it.label}>{it.label}</span>
          {!disabled && (
            <button
              type="button"
              aria-label={t("admin.pickers.remove", "Remove")}
              onClick={() => onRemove(it.value)}
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

/**
 * Search-and-pick for packages. Admins type a name / provider, click a result.
 * value: string (single) or string[] (multi) of product IDs.
 */
export function ProductPicker({ value, onChange, multi = false }) {
  const { t } = useTranslation();
  const ids = useMemo(
    () => (multi ? value || [] : value ? [value] : []),
    [multi, value],
  );
  const [labels, setLabels] = useState({});
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);

  // Saved IDs → readable names.
  useEffect(() => {
    const missing = ids.filter((id) => !labels[id]);
    if (!missing.length) return undefined;
    let alive = true;
    adminApiExtra
      .lookupProducts(missing)
      .then((r) => {
        if (!alive) return;
        setLabels((l) => {
          const next = { ...l };
          for (const p of r.items) next[p.productId] = productLabel(p);
          for (const id of missing) if (!next[id]) next[id] = id;
          return next;
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await adminApi.listProducts({ q: q.trim(), page: 1 });
        if (alive) setResults(r.items || []);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setBusy(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [q, open]);

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(p) {
    setLabels((l) => ({ ...l, [p.productId]: productLabel(p) }));
    if (multi) {
      if (!ids.includes(p.productId)) onChange([...ids, p.productId]);
    } else {
      onChange(p.productId);
      setOpen(false);
    }
    setQ("");
  }

  const chips = ids.map((id) => ({ value: id, label: labels[id] || id }));
  const remove = (id) =>
    onChange(multi ? ids.filter((x) => x !== id) : "");

  return (
    <div className="ep-box" ref={boxRef}>
      <Chips items={chips} onRemove={remove} />
      {(multi || !ids.length) && (
        <input
          value={q}
          placeholder={t(
            "admin.pickers.search_products",
            "Search a package by name or provider…",
          )}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
        />
      )}
      {open && (
        <ul className="ep-results">
          {busy && results.length === 0 && (
            <li className="ep-empty">{t("admin.finance.loading")}</li>
          )}
          {!busy && results.length === 0 && (
            <li className="ep-empty">
              {t("admin.pickers.no_results", "No packages found")}
            </li>
          )}
          {results.map((p) => (
            <li key={p.productId}>
              <button type="button" className="ep-result" onClick={() => pick(p)}>
                <strong>{p.title}</strong>
                <small>
                  {[
                    p.providerName,
                    p.dataLimit ? `${p.dataLimit}${p.dataUnit || ""}` : null,
                    p.validityDays ? `${p.validityDays}d` : null,
                    `$${Number(p.price).toFixed(2)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Generic dropdown (single) or dropdown + chips (multi). */
export function ChoiceSelect({
  options,
  value,
  onChange,
  multi = false,
  placeholder,
  loading = false,
}) {
  const selected = multi ? value || [] : value ? [value] : [];
  const byValue = useMemo(
    () => Object.fromEntries(options.map((o) => [o.value, o.label])),
    [options],
  );

  if (!multi) {
    return (
      <div className="ep-box">
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">{loading ? "…" : placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div className="ep-box">
      <Chips
        items={selected.map((v) => ({ value: v, label: byValue[v] || v }))}
        onRemove={(v) => onChange(selected.filter((x) => x !== v))}
      />
      <select
        value=""
        onChange={(e) => {
          if (e.target.value && !selected.includes(e.target.value))
            onChange([...selected, e.target.value]);
        }}
      >
        <option value="">{loading ? "…" : placeholder}</option>
        {options
          .filter((o) => !selected.includes(o.value))
          .map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
      </select>
    </div>
  );
}

let providersCache = null;
let countriesCache = null;

function useCached(loader, cacheGet, cacheSet) {
  const [data, setData] = useState(cacheGet());
  useEffect(() => {
    if (cacheGet()) return undefined;
    let alive = true;
    loader()
      .then((r) => {
        cacheSet(r);
        if (alive) setData(r);
      })
      .catch(() => alive && setData([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return data;
}

export function ProviderSelect({ value, onChange, multi = false }) {
  const { t } = useTranslation();
  const data = useCached(
    () =>
      adminApiExtra.listProviders().then((r) =>
        r.items.map((p) => ({
          value: p.id,
          label: `${p.name} (${p.planCount})`,
        })),
      ),
    () => providersCache,
    (v) => (providersCache = v),
  );
  return (
    <ChoiceSelect
      options={data || []}
      loading={!data}
      value={value}
      onChange={onChange}
      multi={multi}
      placeholder={t("admin.pickers.select_provider", "Choose a provider…")}
    />
  );
}

export function CountrySelect({ value, onChange, multi = false }) {
  const { t } = useTranslation();
  const data = useCached(
    () =>
      adminApiExtra.listCountries().then((r) =>
        r.countries.map((c) => ({
          value: c.code,
          label: `${c.name} (${c.code})`,
        })),
      ),
    () => countriesCache,
    (v) => (countriesCache = v),
  );
  return (
    <ChoiceSelect
      options={data || []}
      loading={!data}
      value={value}
      onChange={onChange}
      multi={multi}
      placeholder={t("admin.pickers.select_country", "Choose a country…")}
    />
  );
}
