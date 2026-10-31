import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiClient } from "../services/apiClient.js";

const DEFAULT_SITE_NAME = "eSIM";
const SiteInfoContext = createContext(null);

function normalizeSiteInfo(info) {
  const siteName =
    typeof info?.siteName === "string" && info.siteName.trim()
      ? info.siteName.trim()
      : DEFAULT_SITE_NAME;

  return {
    siteName,
    supportEmail:
      typeof info?.supportEmail === "string" ? info.supportEmail : "",
    maintenance: Boolean(info?.maintenance),
  };
}

export function SiteInfoProvider({ children }) {
  const [siteInfo, setSiteInfo] = useState(() => normalizeSiteInfo(null));

  const refreshSiteInfo = useCallback(async () => {
    try {
      const info = await apiClient.get("/api/site-info");
      setSiteInfo(normalizeSiteInfo(info));
      return info;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshSiteInfo();
  }, [refreshSiteInfo]);

  useEffect(() => {
    document.title = siteInfo.siteName || DEFAULT_SITE_NAME;
  }, [siteInfo.siteName]);

  const value = useMemo(
    () => ({ ...siteInfo, refreshSiteInfo }),
    [siteInfo, refreshSiteInfo],
  );

  return (
    <SiteInfoContext.Provider value={value}>
      {children}
    </SiteInfoContext.Provider>
  );
}

export function useSiteInfo() {
  const context = useContext(SiteInfoContext);
  if (!context) {
    throw new Error("useSiteInfo must be used within a SiteInfoProvider");
  }
  return context;
}
