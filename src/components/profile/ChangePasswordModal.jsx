import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button.jsx";
import { authApi } from "../../services/authApi.js";
import { useAuth } from "../../hooks/useAuth.jsx";
import "./AccountModals.css";

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

export function ChangePasswordModal({ onClose }) {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  // Google/Apple accounts have no password yet: they set one without a
  // "current password".
  const hasPassword = user?.hasPassword !== false;

  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate() {
    if (hasPassword && !form.oldPassword)
      return t("profile.err_current_required", "Enter your current password");
    if (form.newPassword.length < MIN_LENGTH)
      return t(
        "profile.err_password_short",
        "New password must be at least 8 characters",
      );
    if (form.newPassword.length > MAX_LENGTH)
      return t(
        "profile.err_password_long",
        "New password must be at most 72 characters",
      );
    if (hasPassword && form.newPassword === form.oldPassword)
      return t(
        "profile.err_password_same",
        "New password must be different from the current one",
      );
    if (form.newPassword !== form.confirm)
      return t("profile.err_password_mismatch", "New passwords don't match");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || success) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.changePassword({
        ...(hasPassword ? { oldPassword: form.oldPassword } : {}),
        newPassword: form.newPassword,
      });
      await refresh();
      setSuccess(true);
      setTimeout(onClose, 1400);
    } catch (err) {
      setError(
        err.message ||
          t("profile.err_generic", "Something went wrong — please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const field = (id, label, value, onChange, autoComplete) => (
    <label className="acct-field" htmlFor={id}>
      {label}
      <div className="acct-input-wrap">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={submitting || success}
        />
        <button
          type="button"
          className="acct-input-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={
            show
              ? t("profile.hide_password", "Hide passwords")
              : t("profile.show_password", "Show passwords")
          }
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );

  return (
    <div className="acct-modal-overlay" onClick={onClose}>
      <div
        className="acct-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
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
        <h2 id="change-password-title">
          {hasPassword
            ? t("profile.change_password", "Change Password")
            : t("profile.set_password", "Set a password")}
        </h2>
        <p className="acct-modal-subtitle">
          {hasPassword
            ? t(
                "profile.change_password_sub",
                "Enter your current password, then choose a new one.",
              )
            : t(
                "profile.set_password_sub",
                "You signed in with Google or Apple, so your account has no password yet.",
              )}
        </p>

        <form className="acct-form" onSubmit={handleSubmit} noValidate>
          {hasPassword &&
            field(
              "cp-old",
              t("profile.current_password", "Current password"),
              form.oldPassword,
              update("oldPassword"),
              "current-password",
            )}
          {field(
            "cp-new",
            t("profile.new_password", "New password"),
            form.newPassword,
            update("newPassword"),
            "new-password",
          )}
          <span className="acct-hint">
            {t("profile.password_hint", "At least 8 characters.")}
          </span>
          {field(
            "cp-confirm",
            t("profile.confirm_password", "Confirm new password"),
            form.confirm,
            update("confirm"),
            "new-password",
          )}

          {error && (
            <div className="acct-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="acct-success" role="status">
              {hasPassword
                ? t("profile.password_changed", "Password changed successfully.")
                : t("profile.password_set", "Password set successfully.")}
            </div>
          )}

          <div className="acct-actions">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={submitting || success}>
              {submitting
                ? t("common.loading", "Loading…")
                : hasPassword
                  ? t("profile.update_password", "Update password")
                  : t("profile.set_password", "Set a password")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
