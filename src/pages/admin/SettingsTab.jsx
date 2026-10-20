import { useCallback, useEffect, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { adminApi } from "../../services/adminApi.js";
import { useTranslation } from "react-i18next";
import { SecretRow } from "./shared.jsx";

export function SettingsTab({  }) {
  const { t } = useTranslation();
  const [secrets, setSecrets] = useState(null);
  const [secretsError, setSecretsError] = useState("");
  const [editingSecret, setEditingSecret] = useState(null);
  const [savingSecret, setSavingSecret] = useState(null);

  const loadSecrets = useCallback(async () => {
    try {
      setSecrets(await adminApi.getSecrets());
    } catch (err) {
      setSecretsError(err.message || "Failed to load");
    }
  }, []);

  useEffect(() => {
    loadSecrets();
  }, [loadSecrets]);

  async function onUpdateSecret(key, value) {
    setSavingSecret(key);
    try {
      await adminApi.updateSecret(key, value);
      await loadSecrets();
    } finally {
      setSavingSecret(null);
      setEditingSecret(null);
    }
  }

  const [markupInput, setMarkupInput] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((s) => {
        setMarkupInput(String(s.markupPercent ?? ""));
        setReferralInput(String(s.referralRewardAmount ?? ""));
      })
      .catch((err) => console.error("[admin] settings failed:", err));
  }, []);

  async function saveSetting(patch, apply) {
    setSavingSettings(true);
    try {
      const updated = await adminApi.updateSettings(patch);
      apply(updated);
    } finally {
      setSavingSettings(false);
      setEditingSecret(null);
    }
  }
  const onSaveMarkup = () =>
    saveSetting({ markupPercent: Number(editingSecret?.value) }, (u) => setMarkupInput(String(u.markupPercent ?? "")));
  const onSaveReferral = () =>
    saveSetting({ referralRewardAmount: Number(editingSecret?.value) }, (u) => setReferralInput(String(u.referralRewardAmount ?? "")));

  return (
      <section className="admin-section">
        <header className="admin-section-head">
          <h1>{t("admin.tab_configuration")}</h1>
          <p>{t("admin.config_note")}</p>
        </header>

        <Card className="admin-card">
          <h3 className="system-config-subhead">{t("admin.pricing")}</h3>
          <div className="secrets-list">
            <SecretRow
              t={t}
              label="MARKUP_PERCENT"
              value={`${markupInput}%`}
              editing={editingSecret?.key === "MARKUP_PERCENT"}
              editingValue={editingSecret?.value}
              inputType="number"
              onEdit={() =>
                setEditingSecret({
                  key: "MARKUP_PERCENT",
                  value: markupInput,
                })
              }
              onChange={(value) =>
                setEditingSecret({ key: "MARKUP_PERCENT", value })
              }
              onCancel={() => setEditingSecret(null)}
              onSave={onSaveMarkup}
              saving={savingSettings}
            />
            <SecretRow
              t={t}
              label="REFERRAL_REWARD"
              value={`${referralInput}`}
              editing={editingSecret?.key === "REFERRAL_REWARD"}
              editingValue={editingSecret?.value}
              inputType="number"
              onEdit={() =>
                setEditingSecret({
                  key: "REFERRAL_REWARD",
                  value: referralInput,
                })
              }
              onChange={(value) =>
                setEditingSecret({ key: "REFERRAL_REWARD", value })
              }
              onCancel={() => setEditingSecret(null)}
              onSave={onSaveReferral}
              saving={savingSettings}
            />
          </div>

          <h3 className="system-config-subhead">
            {t("admin.sync_operations")}
          </h3>
          {secrets ? (
            <div className="secrets-list">
              {[
                "SYNC_INTERVAL_MINUTES",
                "SYNC_ON_STARTUP",
                "MAX_DEACTIVATION_RATIO",
                "EXCHANGE_RATE_USD_TO_EGP",
              ].map((key) => (
                <SecretRow
                  t={t}
                  key={key}
                  label={key}
                  value={secrets[key]}
                  editing={editingSecret?.key === key}
                  editingValue={editingSecret?.value}
                  onEdit={() => setEditingSecret({ key, value: "" })}
                  onChange={(value) => setEditingSecret({ key, value })}
                  onCancel={() => setEditingSecret(null)}
                  onSave={() => onUpdateSecret(key, editingSecret.value)}
                  saving={savingSecret === key}
                />
              ))}
            </div>
          ) : (
            <Spinner label={t("admin.sync_loading")} />
          )}
        </Card>
      </section>
  );
}
