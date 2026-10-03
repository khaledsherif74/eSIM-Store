import { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "../services/apiClient.js";

const CurrencyContext = createContext(null);

export const DISPLAY_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "AED", name: "UAE Dirham", symbol: "AED " },
  { code: "AUD", name: "Australian Dollar", symbol: "AU$" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD " },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF " },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "DKK", name: "Danish Krone", symbol: "kr " },
  { code: "EGP", name: "Egyptian Pound", symbol: "EGP " },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "JD " },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD " },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr " },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR " },
  { code: "PLN", name: "Polish Zloty", symbol: "zł " },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR " },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR " },
  { code: "SEK", name: "Swedish Krona", symbol: "kr " },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "ZAR", name: "South African Rand", symbol: "R " },
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
