import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.jsx";
import { authApi } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import "./AccountModals.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function PersonalInfoModal({ user, onClose }) {
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || success) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName)
      return setError(t("profile.err_name_required", "Name can't be empty"));
    if (!EMAIL_RE.test(trimmedEmail))
      return setError(
        t("profile.err_email_invalid", "Enter a valid email address"),
      );

    const changes = {};
    if (trimmedName !== (user?.name || "")) changes.name = trimmedName;
    if (trimmedEmail !== (user?.email || "").toLowerCase())
      changes.email = trimmedEmail;
    if (Object.keys(changes).length === 0) return onClose();

    setSubmitting(true);
    setError(null);
    try {
      await authApi.updateProfile(changes);
      await refresh();
      setSuccess(true);
      setTimeout(onClose, 1000);
    } catch (err) {
      setError(
        err.message ||
          t("profile.err_generic", "Something went wrong — please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="acct-modal-overlay" onClick={onClose}>
      <div
        className="acct-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="acct-modal-close"
          onClick={onClose}
          aria-label={t("common.cancel", "Cancel")}
        >
          <X size={18} />
        </button>
        <h2 id="personal-info-title">
          {t("profile.personal_info", "Personal Information")}
        </h2>
        <p className="acct-modal-subtitle">
          {t(
            "profile.personal_info_sub",
            "Update the name and email on your account.",
          )}
        </p>

        <form className="acct-form" onSubmit={handleSubmit} noValidate>
          <label className="acct-field" htmlFor="pi-name">
            {t("profile.full_name", "Full name")}
            <input
              id="pi-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoComplete="name"
              disabled={submitting || success}
            />
          </label>

          <label className="acct-field" htmlFor="pi-email">
            {t("profile.email", "Email")}
            <input
              id="pi-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={submitting || success}
            />
          </label>

          {error && (
            <div className="acct-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="acct-success" role="status">
              {t("profile.info_updated", "Profile updated.")}
            </div>
          )}

          <div className="acct-actions">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={submitting || success}>
              {submitting
                ? t("common.loading", "Loading…")
                : t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
