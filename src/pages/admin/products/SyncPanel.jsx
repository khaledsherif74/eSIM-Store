import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Spinner } from "../../../components/ui/Spinner.jsx";
import { formatDate } from "../../../utils/orderData.js";
import { adminApi } from "../../../services/adminApi.js";
import { useTranslation } from "react-i18next";

export function SyncPanel({  }) {
  const { t } = useTranslation();
  const [syncMeta, setSyncMeta] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    adminApi.syncStatus().then(setSyncMeta).catch((err) => console.error("[admin] sync status failed:", err));
  }, []);

  async function onSync() {
    setSyncing(true);
    const before = syncMeta?.lastAttemptAt;
    try {
      await adminApi.triggerSync();
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const meta = await adminApi.syncStatus();
          if (meta.lastAttemptAt !== before || attempts >= 20) {
            setSyncMeta(meta);
            clearInterval(poll);
            setSyncing(false);
          }
        } catch {
          clearInterval(poll);
          setSyncing(false);
        }
      }, 3000);
    } catch {
      setSyncing(false);
    }
  }

  return (
      <section className="admin-section">
        <header className="admin-section-head">
          <h1>{t("admin.tab_sync", "Catalogue Sync")}</h1>
          <p>{t("admin.sync_sub_title")}</p>
        </header>

        <Card className="admin-card">
          <h2 className="card-title">{t("admin.sync_title")}</h2>
          {syncMeta ? (
            <dl className="admin-kv">
              <dt>{t("admin.sync_last_status")}</dt>
              <dd>{syncMeta.lastStatus || t("admin.sync_never_run")}</dd>
              <dt>{t("admin.sync_last_attempt")}</dt>
              <dd>
                {syncMeta.lastAttemptAt
                  ? formatDate(syncMeta.lastAttemptAt)
                  : "—"}
              </dd>
              <dt>{t("admin.sync_last_success")}</dt>
              <dd>
                {syncMeta.lastSuccessAt
                  ? formatDate(syncMeta.lastSuccessAt)
                  : "—"}
              </dd>
              <dt>{t("admin.sync_products_fetched")}</dt>
              <dd>{syncMeta.history?.[0]?.fetched ?? "—"}</dd>
              {syncMeta.lastError && (
                <>
                  <dt>{t("admin.sync_last_error")}</dt>
                  <dd className="admin-error-text">
                    {syncMeta.lastError}
                  </dd>
                </>
              )}
            </dl>
          ) : (
            <Spinner label={t("admin.sync_loading")} />
          )}
          <Button
            icon={
              <RefreshCw size={16} className={syncing ? "spin" : ""} />
            }
            onClick={onSync}
            disabled={syncing}
          >
            {syncing ? t("admin.syncing") : t("admin.sync_now")}
          </Button>
        </Card>
      </section>
  );
}
