import { useCallback, useEffect, useState } from "react";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { adminApi } from "../../services/adminApi.js";
import { useTranslation } from "react-i18next";
import { SecretRow } from "./shared.jsx";

export function SecretsTab({  }) {
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

  return (
      <section className="admin-section">
        <header className="admin-section-head">
          <h1>{t("admin.tab_secrets", "System Secrets")}</h1>
          <p>{t("admin.config_note")}</p>
        </header>

        <div className="system-config-columns">
          <div className="system-config-column">
            <h3 className="system-config-subhead">
              {t("admin.mobimatter")}
            </h3>
            {secrets ? (
              <div className="secrets-list">
                {[
                  "MOBIMATTER_BASE_URL",
                  "MOBIMATTER_API_KEY",
                  "MOBIMATTER_MERCHANT_ID",
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
                    onSave={() =>
                      onUpdateSecret(key, editingSecret.value)
                    }
                    saving={savingSecret === key}
                  />
                ))}
              </div>
            ) : (
              <Spinner label={t("admin.sync_loading")} />
            )}

            <h3 className="system-config-subhead">{t("admin.paymob")}</h3>
            {secrets ? (
              <div className="secrets-list">
                {[
                  "PAYMOB_API_KEY",
                  "PAYMOB_INTEGRATION_ID",
                  "PAYMOB_IFRAME_ID",
                  "PAYMOB_HMAC_SECRET",
                  "PAYMOB_PUBLIC_KEY",
                  "PAYMOB_SECRET_KEY",
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
                    onSave={() =>
                      onUpdateSecret(key, editingSecret.value)
                    }
                    saving={savingSecret === key}
                  />
                ))}
              </div>
            ) : (
              <Spinner label={t("admin.sync_loading")} />
            )}
          </div>

          <div className="system-config-column">
            <h3 className="system-config-subhead">{t("admin.smtp")}</h3>
            {secrets ? (
              <div className="secrets-list">
                {["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"].map(
                  (key) => (
                    <SecretRow
                      t={t}
                      key={key}
                      label={key}
                      value={secrets[key]}
                      editing={editingSecret?.key === key}
                      editingValue={editingSecret?.value}
                      onEdit={() => setEditingSecret({ key, value: "" })}
                      onChange={(value) =>
                        setEditingSecret({ key, value })
                      }
                      onCancel={() => setEditingSecret(null)}
                      onSave={() =>
                        onUpdateSecret(key, editingSecret.value)
                      }
                      saving={savingSecret === key}
                    />
                  ),
                )}
              </div>
            ) : (
              <Spinner label={t("admin.sync_loading")} />
            )}

            <h3 className="system-config-subhead">
              {t("admin.admin_account")}
            </h3>
            {secrets ? (
              <div className="secrets-list">
                <SecretRow
                  t={t}
                  label="ADMIN_USERNAME"
                  value={secrets.ADMIN_USERNAME}
                  editing={editingSecret?.key === "ADMIN_USERNAME"}
                  editingValue={editingSecret?.value}
                  onEdit={() =>
                    setEditingSecret({ key: "ADMIN_USERNAME", value: "" })
                  }
                  onChange={(value) =>
                    setEditingSecret({ key: "ADMIN_USERNAME", value })
                  }
                  onCancel={() => setEditingSecret(null)}
                  onSave={() =>
                    onUpdateSecret("ADMIN_USERNAME", editingSecret.value)
                  }
                  saving={savingSecret === "ADMIN_USERNAME"}
                />
                <SecretRow
                  t={t}
                  label="Admin Password"
                  value={secrets.ADMIN_PASSWORD_HASH}
                  editing={editingSecret?.key === "ADMIN_PASSWORD_HASH"}
                  editingValue={editingSecret?.value}
                  inputType="password"
                  placeholder={t("admin.new_password_placeholder")}
                  onEdit={() =>
                    setEditingSecret({
                      key: "ADMIN_PASSWORD_HASH",
                      value: "",
                    })
                  }
                  onChange={(value) =>
                    setEditingSecret({
                      key: "ADMIN_PASSWORD_HASH",
                      value,
                    })
                  }
                  onCancel={() => setEditingSecret(null)}
                  onSave={() =>
                    onUpdateSecret(
                      "ADMIN_PASSWORD_HASH",
                      editingSecret.value,
                    )
                  }
                  saving={savingSecret === "ADMIN_PASSWORD_HASH"}
                />
              </div>
            ) : (
              <Spinner label={t("admin.sync_loading")} />
            )}
          </div>
        </div>
      </section>
  );
}
