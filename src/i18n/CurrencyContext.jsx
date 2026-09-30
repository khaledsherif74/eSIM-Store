import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";

const CurrencyContext = createContext(null);

export const DISPLAY_CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "EUR", symbol: "€" },
  { code: "AED", symbol: "AED " },
  { code: "SAR", symbol: "SAR " },
  { code: "EGP", symbol: "EGP " },
  { code: "CAD", symbol: "CA$" },
  { code: "AUD", symbol: "AU$" },
];

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    localStorage.getItem("display-currency") || "USD",
  );
  const [rates, setRates] = useState({});

  useEffect(() => {
    let alive = true;
    apiClient
      .get("/api/currency-rates")
      .then((r) => alive && setRates(r.rates || {}))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function setCurrency(next) {
    setCurrencyState(next);
    localStorage.setItem("display-currency", next);
  }

  function convert(usdAmount) {
    if (currency === "USD" || !rates[currency]) return null;
    return Number(usdAmount) * rates[currency];
  }

  function format(usdAmount) {
    const converted = convert(usdAmount);
    if (converted == null) return null;
    const meta = DISPLAY_CURRENCIES.find((c) => c.code === currency);
    return `≈ ${meta?.symbol || ""}${converted.toFixed(2)}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error("useCurrency() must be used within a CurrencyProvider");
  return ctx;
}
