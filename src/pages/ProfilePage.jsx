import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Check,
  Wallet,
  Gift,
  Settings,
  LogOut,
  Globe,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../services/apiClient";
import { authApi } from "../services/authApi";
import { Button } from "../components/ui/Button";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";
import { TopUpModal } from "../components/profile/TopUpModal.jsx";
import { ChangePasswordModal } from "../components/profile/ChangePasswordModal.jsx";
import { PersonalInfoModal } from "../components/profile/PersonalInfoModal.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./ProfilePage.css";
import hero from "../public/images/hero.png";

export const ProfilePage = () => {
  const { user, loading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();

  const [walletData, setWalletData] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(true);

  const [copied, setCopied] = useState(false);

  const [showTopUp, setShowTopUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  useEffect(() => {
    const fetchWalletAndTx = async () => {
      try {
        const [balance, history] = await Promise.all([
          apiClient.get("/api/wallet/balance"),
          apiClient.get("/api/wallet/history"),
        ]);

        setWalletData(balance);
        setTransactions(history);
      } catch (err) {
        console.error("Failed to fetch wallet data", err);
      } finally {
        setWalletLoading(false);
        setTxLoading(false);
      }
    };

    fetchWalletAndTx();
  }, []);

  useEffect(() => {
    if (params.get("topup") !== "pending") return;

    const hasPaymobFields =
      params.has("success") || params.has("hmac") || params.has("id");

    if (hasPaymobFields) {
      apiClient
        .post("/api/payments/confirm", Object.fromEntries(params.entries()))
        .catch(() => {});
    }

    let attempts = 0;

    const interval = setInterval(() => {
      attempts += 1;

      apiClient
        .get("/api/wallet/balance")
        .then((data) => setWalletData(data))
        .catch(() => {});

      if (attempts >= 6) {
        clearInterval(interval);

        const next = new URLSearchParams(params);
        next.delete("topup");
        next.delete("ref");

        setParams(next, { replace: true });
      }
    }, 2000);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || walletLoading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="profile-hero">
            <div className="container profile-hero-inner">
              <Skeleton
                variant="circle"
                size={80}
                className="profile-avatar-skeleton"
              />

              <Skeleton variant="title" className="profile-name-skeleton" />
            </div>
          </div>
        </div>

        <div className="container profile-container">
          <div className="profile-grid">
            <SkeletonCard className="wallet-skeleton">
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </SkeletonCard>

            <SkeletonCard className="wallet-skeleton">
              <Skeleton variant="text" />
              <Skeleton variant="text" />
            </SkeletonCard>
          </div>

          <SkeletonCard className="transactions-skeleton">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </SkeletonCard>

          <SkeletonCard className="settings-skeleton">
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </SkeletonCard>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-signed-out">
        Please log in to view your profile.
      </div>
    );
  }

  const handleCopyReferral = async () => {
    const link = `${window.location.origin}/auth?ref=${encodeURIComponent(
      user.referralCode || "",
    )}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy referral link", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div
          className="profile-hero"
          style={{
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="container profile-hero-inner">
            <div className="profile-avatar">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="profile-info">
              <h1>{user.name || "User"}</h1>
              <p>{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-container">
        <div className="profile-grid">
          <div
            className="profile-card wallet-card"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-success))",
            }}
          >
            <div className="wallet-card-top">
              <div className="profile-card-header">
                <div className="profile-card-icon wallet-icon">
                  <Wallet size={20} />
                </div>

                <div className="profile-card-title-group">
                  <h3>{t("profile.my_wallet")}</h3>
                  <p>Manage your wallet balance</p>
                </div>
              </div>
            </div>

            <div className="wallet-card-bottom">
              <div className="balance-display">
                <span className="balance-amount">
                  ${walletData?.balance || "0.00"}
                </span>

                <span className="balance-currency">USD</span>
              </div>

              <Button
                className="wallet-topup-btn"
                onClick={() => setShowTopUp(true)}
              >
                {t("profile.top_up")}
              </Button>
            </div>
          </div>

          <div className="profile-card referral-card">
            <div className="profile-card-header">
              <div className="profile-card-icon referral-icon">
                <Gift size={20} />
              </div>

              <div className="profile-card-title-group">
                <h3>{t("profile.refer_friend")}</h3>
                <p>Invite friends and share your referral link.</p>
              </div>
            </div>

            <div className="referral-code-box">
              <code>{user.referralCode || "Generating..."}</code>

              <Button
                onClick={handleCopyReferral}
                variant="secondary"
                size="sm"
                className="copy-btn"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
              >
                {copied ? t("profile.link_copied") : t("profile.copy_link")}
              </Button>
            </div>

            <p className="referral-note">{t("profile.refer_note")}</p>
          </div>
        </div>

        <div className="transactions-section">
          <div className="transactions-card">
            <div className="transactions-header">
              <div>
                <h3>
                  {t("profile.recent_transactions") || "Recent Transactions"}
                </h3>

                <p>View your wallet activity</p>
              </div>

              <Button variant="ghost" size="sm" className="view-all-btn">
                View all
              </Button>
            </div>

            <div className="transactions-list">
              {txLoading ? (
                <div className="transactions-loading">
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="transactions-empty">No transactions yet.</div>
              ) : (
                transactions.map((tx) => {
                  const isCredit = tx.type === "Credit";

                  return (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-info">
                        <div
                          className="transaction-icon"
                          style={{
                            backgroundColor: isCredit
                              ? "var(--color-success-soft)"
                              : "var(--color-surface-alt)",
                            color: isCredit
                              ? "var(--color-success)"
                              : "var(--color-text)",
                          }}
                        >
                          {isCredit ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownLeft size={16} />
                          )}
                        </div>

                        <div className="transaction-details">
                          <span className="transaction-purpose">
                            {tx.purpose}
                          </span>

                          <span className="transaction-date">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="transaction-right">
                        <span
                          className={`transaction-amount ${
                            isCredit ? "amount-credit" : "amount-debit"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {tx.amount} USD
                        </span>

                        <span className="transaction-status">Completed</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="profile-settings">
          <div className="profile-settings-heading">
            <Settings size={16} />
            {t("profile.account_settings")}
          </div>

          <div className="settings-item">
            <span className="settings-item-label">
              <Globe size={16} />
              {t("profile.language")}
            </span>

            <div className="settings-item-action">
              <select
                className="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
              </select>

              <ChevronRight size={16} />
            </div>
          </div>

          <div
            className="settings-item settings-item-clickable"
            role="button"
            tabIndex={0}
            onClick={() => setShowPassword(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowPassword(true);
              }
            }}
          >
            <span className="settings-item-label">
              <Lock size={16} />
              {t("profile.change_password") || "Change Password"}
            </span>

            <div className="settings-item-action">
              <ChevronRight size={16} />
            </div>
          </div>

          <div
            className="settings-item settings-item-clickable"
            role="button"
            tabIndex={0}
            onClick={() => setShowPersonalInfo(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setShowPersonalInfo(true);
              }
            }}
          >
            <span className="settings-item-label">
              <User size={16} />
              {t("profile.personal_information") || "Personal Information"}
            </span>

            <div className="settings-item-action">
              <ChevronRight size={16} />
            </div>
          </div>

          <Button
            variant="secondary"
            fullWidth
            className="logout-btn"
            icon={<LogOut size={16} />}
            onClick={handleLogout}
          >
            {t("profile.logout")}
          </Button>
        </div>
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}

      {showPassword && (
        <ChangePasswordModal onClose={() => setShowPassword(false)} />
      )}

      {showPersonalInfo && (
        <PersonalInfoModal
          user={user}
          onClose={() => setShowPersonalInfo(false)}
        />
      )}
    </div>
  );
};
