import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  Empty,
  Kpi,
  Num,
  StateBox,
  errorText,
  fmtUsd,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";
import "./LedgerTab.css";

const PURPOSES = [
  "Topup",
  "Purchase",
  "ReferralReward",
  "Adjustment",
  "ReferralRevoke",
  "Expiry",
];

function WalletAdjustmentConfirmDialog({
  open,
  customer,
  direction,
  amount,
  currentBalance,
  nextBalance,
  reason,
  busy,
  onCancel,
  onConfirm,
  t,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onCancel]);

  if (!open || !customer) return null;

  const isDebit = direction === "Debit";
  const customerName =
    customer.name ||
    customer.email ||
    t("admin.referrals.unnamed_customer", "Customer");

  return (
    <div
      className="wallet-adjust-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="wallet-adjust-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="wallet-adjust-dialog-title"
        aria-describedby="wallet-adjust-dialog-description"
        tabIndex={-1}
      >
        <button
          type="button"
          className="wallet-adjust-dialog-close"
          onClick={onCancel}
          disabled={busy}
          aria-label={t("common.close", "Close")}
        >
          <X size={19} />
        </button>

        <div
          className={`wallet-adjust-dialog-icon${isDebit ? " is-danger" : ""}`}
          aria-hidden="true"
        >
          {isDebit ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
        </div>
        <h2 id="wallet-adjust-dialog-title">
          {t(
            "admin.referrals.adjust_confirm_title",
            "Confirm wallet adjustment",
          )}
        </h2>
        <p
          id="wallet-adjust-dialog-description"
          className="wallet-adjust-dialog-description"
        >
          {t(
            "admin.referrals.adjust_confirm_prompt",
            "Please review the transaction details before confirming.",
          )}
        </p>

        <div className="wallet-adjust-dialog-customer">
          <strong dir="auto">{customerName}</strong>
          {customer.email && <span dir="ltr">{customer.email}</span>}
        </div>

        <dl className="wallet-adjust-dialog-details">
          <div>
            <dt>{t("admin.referrals.direction", "Action")}</dt>
            <dd className={isDebit ? "is-danger" : "is-positive"}>
              {isDebit
                ? t("admin.referrals.debit", "Remove funds")
                : t("admin.referrals.credit", "Add funds")}
            </dd>
          </div>
          <div>
            <dt>{t("admin.referrals.amount_usd", "Amount (USD)")}</dt>
            <dd>{fmtUsd(amount)}</dd>
          </div>
          <div>
            <dt>
              {t("admin.referrals.current_wallet_balance", "Current balance")}
            </dt>
            <dd>{fmtUsd(currentBalance)}</dd>
          </div>
          <div className="is-total">
            <dt>
              {t("admin.referrals.new_wallet_balance", "New wallet balance")}
            </dt>
            <dd>{fmtUsd(nextBalance)}</dd>
          </div>
          <div className="is-reason">
            <dt>{t("admin.referrals.reason", "Reason")}</dt>
            <dd>{reason}</dd>
          </div>
        </dl>

        <p className="wallet-adjust-dialog-notice">
          {t(
            "admin.referrals.adjust_confirm_notice",
            "This transaction will be recorded in the wallet ledger and admin audit log.",
          )}
        </p>

        <div className="wallet-adjust-dialog-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant={isDebit ? "danger" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy
              ? t("admin.finance.saving", "Saving…")
              : t("admin.referrals.confirm_adjustment", "Confirm adjustment")}
          </Button>
        </div>
      </section>
    </div>
  );
}

function AdjustForm({ onDone }) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    direction: "Credit",
    amountUsd: "",
    reason: "",
  });
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const closeConfirmation = useCallback(() => {
    if (!saving) setConfirmOpen(false);
  }, [saving]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  useEffect(() => {
    const query = customerQuery.trim();
    if (selectedCustomer || query.length < 2) {
      setMatches([]);
      setSearchError("");
      setSearching(false);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError("");
      try {
        const result = await adminApi.searchWalletCustomers(query);
        if (active) setMatches(result.items || []);
      } catch (error) {
        if (active) setSearchError(errorText(error, t));
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [customerQuery, selectedCustomer, t]);

  function chooseCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerQuery(
      [customer.name, customer.email].filter(Boolean).join(" · "),
    );
    setMatches([]);
    setSearchError("");
    setErr("");
    setSuccess("");
  }

  function clearCustomer() {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setMatches([]);
    setErr("");
    setSuccess("");
  }

  function requestSave() {
    const amount = Number(f.amountUsd);
    if (!selectedCustomer?.id || !selectedCustomer.hasWallet) return;
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (f.direction === "Credit" && amount > 5) {
      setErr(
        t(
          "admin.referrals.credit_limit_error",
          "Manual wallet credits are limited to $5.00 per adjustment.",
        ),
      );
      return;
    }

    const currentBalance = Number(selectedCustomer.walletBalance || 0);
    if (f.direction === "Debit" && amount > currentBalance) {
      setErr(
        t(
          "admin.referrals.insufficient_wallet_balance",
          "The customer does not have enough wallet balance.",
        ),
      );
      return;
    }

    setErr("");
    setConfirmOpen(true);
  }

  async function commitAdjustment() {
    const amount = Number(f.amountUsd);
    if (
      !selectedCustomer?.id ||
      !selectedCustomer.hasWallet ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setConfirmOpen(false);
      return;
    }

    setSaving(true);
    setErr("");
    setSuccess("");
    try {
      const result = await adminApi.adjustWallet({
        userId: selectedCustomer.id,
        direction: f.direction,
        amountUsd: amount,
        reason: f.reason.trim(),
      });
      setConfirmOpen(false);
      setF({ direction: "Credit", amountUsd: "", reason: "" });
      setSelectedCustomer(null);
      setCustomerQuery("");
      setMatches([]);
      setSuccess(
        t("admin.referrals.adjust_success", {
          balance: fmtUsd(result.newBalance),
          defaultValue: `Wallet updated successfully. New balance: ${fmtUsd(result.newBalance)}.`,
        }),
      );
      onDone();
    } catch (error) {
      setConfirmOpen(false);
      setErr(errorText(error, t));
    } finally {
      setSaving(false);
    }
  }

  const amount = Number(f.amountUsd);
  const hasValidAmount = Number.isFinite(amount) && amount > 0;
  const expectedBalance =
    selectedCustomer?.hasWallet && hasValidAmount
      ? Number(selectedCustomer.walletBalance || 0) +
        (f.direction === "Credit" ? amount : -amount)
      : null;

  return (
    <Card>
      <h2 className="fin-card-title">{t("admin.referrals.adjust_title")}</h2>
      <div className="fin-form">
        <div className="fin-field wallet-customer-field">
          <label htmlFor="wallet-adjust-customer">
            {t("admin.referrals.customer", "Customer")}
          </label>
          <div className="wallet-customer-input-row">
            <input
              id="wallet-adjust-customer"
              dir="auto"
              value={customerQuery}
              onChange={(event) => {
                setCustomerQuery(event.target.value);
                setSelectedCustomer(null);
                setErr("");
                setSuccess("");
              }}
              autoComplete="off"
              placeholder={t(
                "admin.referrals.wallet_customer_search",
                "Search customer by name or email",
              )}
            />
            {selectedCustomer && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearCustomer}
              >
                {t("admin.referrals.change_customer", "Change")}
              </Button>
            )}
          </div>
          {!selectedCustomer && customerQuery.trim().length < 2 && (
            <span className="fin-sub">
              {t(
                "admin.referrals.wallet_customer_search_hint",
                "Type at least 2 characters to search.",
              )}
            </span>
          )}
          {!selectedCustomer && searching && (
            <span className="fin-sub">
              {t("admin.finance.loading", "Searching customers…")}
            </span>
          )}
          {!selectedCustomer && searchError && (
            <span className="wallet-customer-search-error" role="alert">
              {searchError}
            </span>
          )}
          {!selectedCustomer &&
            !searching &&
            customerQuery.trim().length >= 2 &&
            !searchError &&
            matches.length === 0 && (
              <span className="fin-sub">
                {t(
                  "admin.referrals.wallet_customer_no_results",
                  "No matching customers found.",
                )}
              </span>
            )}
          {!selectedCustomer && matches.length > 0 && (
            <div
              className="wallet-customer-results"
              role="listbox"
              aria-label={t("admin.referrals.customer", "Customer")}
            >
              {matches.map((customer) => (
                <button
                  type="button"
                  className="wallet-customer-option"
                  key={customer.id}
                  disabled={!customer.hasWallet}
                  onClick={() => chooseCustomer(customer)}
                >
                  <span className="wallet-customer-option-main">
                    <strong>
                      {customer.name ||
                        customer.email ||
                        t(
                          "admin.referrals.unnamed_customer",
                          "Unnamed customer",
                        )}
                    </strong>
                    <span>{customer.email || "—"}</span>
                  </span>
                  <span className="wallet-customer-option-balance">
                    {customer.hasWallet
                      ? fmtUsd(customer.walletBalance)
                      : t("admin.referrals.wallet_not_available", "No wallet")}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedCustomer && (
            <div className="wallet-customer-selected">
              <span>
                <strong>
                  {selectedCustomer.name || selectedCustomer.email}
                </strong>
                <span className="fin-sub">{selectedCustomer.email}</span>
              </span>
              <span className="wallet-customer-balance">
                {t("admin.referrals.current_wallet_balance", "Current balance")}
                : {fmtUsd(selectedCustomer.walletBalance)}
              </span>
            </div>
          )}
        </div>

        <label className="fin-field">
          <span>{t("admin.referrals.direction")}</span>
          <select value={f.direction} onChange={set("direction")}>
            <option value="Credit">{t("admin.referrals.credit")}</option>
            <option value="Debit">{t("admin.referrals.debit")}</option>
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.referrals.amount_usd")}</span>
          <input
            type="number"
            min="0.01"
            max={f.direction === "Credit" ? "5.00" : undefined}
            step="0.01"
            value={f.amountUsd}
            onChange={(event) => {
              setF((current) => ({
                ...current,
                amountUsd: event.target.value,
              }));
              setErr("");
            }}
          />
          {f.direction === "Credit" && (
            <span className="fin-sub">
              {t(
                "admin.referrals.credit_limit_hint",
                "Maximum manual credit: $5.00 per transaction.",
              )}
            </span>
          )}
        </label>
        <label className="fin-field wide">
          <span>{t("admin.referrals.reason")}</span>
          <input value={f.reason} maxLength={300} onChange={set("reason")} />
        </label>

        {expectedBalance !== null && (
          <div className="wallet-adjust-preview">
            <span>
              {t(
                "admin.referrals.new_wallet_balance",
                "Expected wallet balance",
              )}
            </span>
            <strong>{fmtUsd(expectedBalance)}</strong>
          </div>
        )}
        {err && (
          <p className="fin-form-error" role="alert">
            {err}
          </p>
        )}
        {success && (
          <p className="wallet-adjust-success" role="status">
            {success}
          </p>
        )}
        <div className="fin-form-actions">
          <Button
            onClick={requestSave}
            disabled={
              saving ||
              !selectedCustomer?.hasWallet ||
              !hasValidAmount ||
              (f.direction === "Credit" && amount > 5) ||
              !f.reason.trim() ||
              (f.direction === "Debit" && expectedBalance < 0)
            }
          >
            {t("admin.referrals.apply_adjustment")}
          </Button>
        </div>
      </div>
      <WalletAdjustmentConfirmDialog
        open={confirmOpen}
        customer={selectedCustomer}
        direction={f.direction}
        amount={amount}
        currentBalance={Number(selectedCustomer?.walletBalance || 0)}
        nextBalance={
          expectedBalance ?? Number(selectedCustomer?.walletBalance || 0)
        }
        reason={f.reason.trim()}
        busy={saving}
        onCancel={closeConfirmation}
        onConfirm={commitAdjustment}
        t={t}
      />
    </Card>
  );
}

export function LedgerTab() {
  const { t } = useTranslation();
  const [purpose, setPurpose] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(
    () => adminApi.getLedger({ purpose, q: search, from, to, page }),
    [purpose, search, from, to, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const commitSearch = () => {
    if (q.trim() !== search) {
      setSearch(q.trim());
      setPage(1);
    }
  };

  function showLatestAdjustment() {
    // Clear filters so the newest adjustment cannot be hidden by an old search/date filter.
    setPurpose("");
    setQ("");
    setSearch("");
    setFrom("");
    setTo("");
    setPage(1);
    reload();
  }

  return (
    <div className="fin-wrap">
      <div className="fin-toolbar">
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            placeholder={t(
              "admin.referrals.search_name_or_email",
              "Name or email",
            )}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.users.type")}</span>
          <select
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("admin.finance.all")}</option>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {t(`admin.referrals.purpose_${p}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.from")}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.to")}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      {data && (
        <div className="fin-grid">
          <Kpi
            label={t("admin.referrals.earned")}
            value={fmtUsd(data.totals.earned)}
          />
          <Kpi
            label={t("admin.referrals.spent")}
            value={fmtUsd(data.totals.spent)}
          />
          <Kpi
            label={t("admin.referrals.expired")}
            value={fmtUsd(data.totals.expired)}
          />
          <Kpi
            label={t("admin.referrals.revoked")}
            value={fmtUsd(data.totals.revoked)}
          />
          <Kpi
            label={t("admin.referrals.topups")}
            value={fmtUsd(data.totals.topups)}
          />
          <Kpi
            label={t("admin.referrals.adjustments")}
            value={fmtUsd(data.totals.adjustments)}
          />
        </div>
      )}

      <AdjustForm onDone={showLatestAdjustment} />

      <Card padded={false}>
        <StateBox loading={loading} error={error} onRetry={reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.referrals.no_ledger")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.time")}</th>
                        <th>{t("admin.users.user")}</th>
                        <th>{t("admin.users.type")}</th>
                        <th className="num">{t("admin.users.amount")}</th>
                        <th>{t("admin.referrals.note")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((x) => (
                        <tr key={x.id}>
                          <td>
                            <Num>{new Date(x.createdAt).toLocaleString()}</Num>
                          </td>
                          <td>
                            <Link
                              to={`/admin/users/${x.userId}`}
                              className="fin-link"
                              dir="auto"
                            >
                              {x.name ||
                                x.email ||
                                t(
                                  "admin.referrals.unnamed_customer",
                                  "Customer",
                                )}
                            </Link>
                            {x.email && (
                              <span className="fin-sub" dir="ltr">
                                {x.email}
                              </span>
                            )}
                          </td>
                          <td>
                            {t(`admin.referrals.purpose_${x.purpose}`)}
                            <span className="fin-sub">{x.type}</span>
                          </td>
                          <td className="num">
                            <Num>
                              {x.type === "Debit" ? "−" : "+"}
                              {fmtUsd(x.amount)}
                            </Num>
                          </td>
                          <td>
                            {x.note || "—"}
                            {x.createdBy && (
                              <span className="fin-sub">
                                {t("admin.referrals.adjusted_by", {
                                  name: x.createdBy,
                                  defaultValue: `Recorded by ${x.createdBy}`,
                                })}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((v) => v - 1)}
                  >
                    {t("admin.previous")}
                  </Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setPage((v) => v + 1)}
                  >
                    {t("admin.next")}
                  </Button>
                </div>
              </>
            )
          )}
        </StateBox>
      </Card>
    </div>
  );
}
