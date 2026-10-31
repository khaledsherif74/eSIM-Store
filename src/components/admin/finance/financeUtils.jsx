import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../../ui/Spinner.jsx";
import { Button } from "../../ui/Button.jsx";
import { useLanguage } from "../../../i18n/LanguageContext.jsx";

export const CATEGORIES = [
  "Infrastructure",
  "Services",
  "Marketing",
  "Payroll",
  "Legal",
  "Other",
];
export const KINDS = ["Fixed", "Once", "Variable"];
export const CYCLES = ["Monthly", "Quarterly", "Yearly"];
export const STATUSES = ["Confirmed", "Draft", "Cancelled"];
export const ROLES = ["Admin", "Accountant", "Support", "Operator"];

const CAIRO = "Africa/Cairo";

export function todayCairo() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO }).format(
    new Date(),
  );
}

export function currentMonth() {
  return todayCairo().slice(0, 7);
}

export function shiftMonth(ym, n) {
  const [y, m] = ym.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export function fmtNum(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtEgp(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return `${v < 0 ? "-" : ""}E£${fmtNum(Math.abs(v))}`;
}

export function fmtUsd(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  return `${v < 0 ? "-" : ""}$${fmtNum(Math.abs(v))}`;
}

export function fmtPct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return `${fmtNum(n, 1)}%`;
}

export function Num({ children }) {
  return (
    <bdi dir="ltr" className="fin-num">
      {children}
    </bdi>
  );
}

export function useAsync(fn, deps) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch(
        (error) => alive && setState({ data: null, loading: false, error }),
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((x) => x + 1) };
}

export function errorText(err, t) {
  if (err?.status === 403) return t("admin.finance.no_access");
  if (err?.status === 423) return t("admin.finance.month_locked_error");
  return err?.message || t("admin.finance.error_generic");
}

export function StateBox({ loading, error, onRetry, children }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="fin-state">
        <Spinner label={t("admin.finance.loading")} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="fin-state fin-state-error" role="alert">
        <p>{errorText(error, t)}</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t("admin.finance.retry")}
          </Button>
        )}
      </div>
    );
  }
  return children;
}

export function Empty({ children }) {
  return <div className="fin-state fin-empty">{children}</div>;
}

export function MonthSelect({
  value,
  onChange,
  allowAll = false,
  count = 36,
  label,
}) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const now = currentMonth();
  const options = [];
  for (let i = 0; i < count; i += 1) options.push(shiftMonth(now, -i));
  if (value && !options.includes(value)) options.push(value);
  const fmt = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <label className="fin-field">
      {label && <span>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {allowAll && <option value="">{t("admin.finance.all")}</option>}
        {options.map((m) => (
          <option key={m} value={m}>
            {fmt.format(new Date(`${m}-01T00:00:00Z`))}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Bars({ rows, format = fmtEgp }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <div className="fin-bars">
      {rows.map((r) => {
        const clickable = typeof r.onClick === "function";
        return (
          <div
            className={`fin-bar-row${clickable ? " fin-bar-row--clickable" : ""}`}
            key={r.key || r.label}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? r.onClick : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      r.onClick();
                    }
                  }
                : undefined
            }
          >
            <span className="fin-bar-label">{r.label}</span>
            <span className="fin-bar-track">
              <span
                className={`fin-bar-fill${r.value < 0 ? " neg" : ""}${r.tone ? ` ${r.tone}` : ""}`}
                style={{ inlineSize: `${(Math.abs(r.value) / max) * 100}%` }}
              />
            </span>
            <span className="fin-bar-value">
              <Num>{format(r.value)}</Num>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Kpi({ label, value, sub, tone }) {
  return (
    <div className={`fin-kpi${tone ? ` ${tone}` : ""}`}>
      <span className="fin-kpi-label">{label}</span>
      <strong className="fin-kpi-value">
        <Num>{value}</Num>
      </strong>
      {sub && <span className="fin-kpi-sub">{sub}</span>}
    </div>
  );
}

export function Delta({ value }) {
  if (value === null || value === undefined) return null;
  const up = value >= 0;
  return (
    <span className={`fin-delta ${up ? "up" : "down"}`}>
      <Num>
        {up ? "▲" : "▼"} {fmtNum(Math.abs(value), 1)}%
      </Num>
    </span>
  );
}

export function statusTone(status) {
  if (status === "Confirmed") return "success";
  if (status === "Draft") return "warning";
  return "neutral";
}

export function countryName(code, language) {
  if (!code) return "";
  if (code === "MULTI" || code === "UNKNOWN") return null;
  try {
    return (
      new Intl.DisplayNames([language === "ar" ? "ar" : "en"], {
        type: "region",
      }).of(code) || code
    );
  } catch {
    return code;
  }
}
