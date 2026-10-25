import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { statusMeta } from "../../../utils/orderData.js";
import {
  Num,
  StateBox,
  errorText,
  fmtEgp,
  fmtUsd,
  useAsync,
} from "../../../components/admin/finance/financeUtils.jsx";

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

function Row({ label, children }) {
  return (
    <div className="ash-kv">
      <span>{label}</span>
      <strong>{children ?? "—"}</strong>
    </div>
  );
}

function copyToClipboard(text) {
  try {
    navigator.clipboard?.writeText(String(text));
  } catch {
    /* ignore */
  }
}

export function OrderDrawer({
  orderId,
  canAct = false,
  canRevealToken = false,
  onClose,
  onChanged,
}) {
  const { t } = useTranslation();
  const {
    data: o,
    loading,
    error,
    reload,
  } = useAsync(() => adminApi.getOrder(orderId), [orderId]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [revealed, setRevealed] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(fn, okKey, confirmKey) {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await fn();
      setMsg({ type: "ok", text: t(okKey) });
      reload();
      onChanged?.();
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(false);
    }
  }

  async function revealToken() {
    if (!window.confirm(t("admin.ops.reveal_confirm"))) return;
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const result = await adminApi.revealOrderAccessToken(orderId);
      setRevealed(result);
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(false);
    }
  }

  async function resendOrderAccess() {
    if (!window.confirm(t("admin.ops.resend_access_confirm"))) return;
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await adminApi.resendOrderAccessEmail(orderId);
      setMsg({ type: "ok", text: t("admin.ops.access_email_sent") });
    } catch (e) {
      setMsg({ type: "err", text: errorText(e, t) });
    } finally {
      setBusy(false);
    }
  }

  const [label, tone] = o ? statusMeta(o.status) : ["", "neutral"];
  return (
    <>
      <div className="ash-drawer-scrim" onClick={onClose} />
      <aside
        className="ash-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={t("admin.ops.order_details")}
      >
        <header className="ash-drawer-head">
          <div>
            <h2 className="mono">{orderId}</h2>
            {o && <Badge tone={tone}>{label}</Badge>}
          </div>
          <button
            type="button"
            className="ash-chip"
            style={{ background: "var(--a-blue-soft)", color: "var(--a-blue)" }}
            onClick={onClose}
            aria-label={t("admin.coupons.close")}
          >
            <X size={16} />
          </button>
        </header>

        <StateBox loading={loading} error={error} onRetry={reload}>
          {o && (
            <div className="ash-drawer-body">
              {canAct && (
                <div className="fin-row-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () => adminApi.refreshOrder(orderId),
                        "admin.ops.refreshed",
                      )
                    }
                  >
                    {t("admin.ops.refresh_supplier")}
                  </Button>
                  {o.status === "Completed" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(
                          () => adminApi.resendOrderEmail(orderId),
                          "admin.ops.email_sent",
                          "admin.ops.resend_confirm",
                        )
                      }
                    >
                      {t("admin.ops.resend_email")}
                    </Button>
                  )}
                </div>
              )}
              {msg.text && (
                <p
                  className={msg.type === "err" ? "fin-form-error" : "fin-note"}
                  role={msg.type === "err" ? "alert" : "status"}
                >
                  {msg.text}
                </p>
              )}

              {canRevealToken && o.hasAccessToken && (
                <section>
                  <h3>{t("admin.ops.guest_access")}</h3>
                  <p className="fin-note">{t("admin.ops.guest_access_note")}</p>
                  <div className="fin-row-actions" style={{ marginTop: 8 }}>
                    {revealed ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRevealed(null)}
                      >
                        {t("admin.ops.hide")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={revealToken}
                      >
                        {t("admin.ops.reveal_access_token")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={resendOrderAccess}
                    >
                      {t("admin.ops.resend_access_email")}
                    </Button>
                  </div>
                  {revealed && (
                    <div className="fin-form" style={{ marginTop: 12 }}>
                      {revealed.link && (
                        <label className="fin-field wide">
                          <span>{t("admin.ops.access_link")}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input
                              readOnly
                              value={revealed.link}
                              dir="ltr"
                              style={{ flex: 1, minWidth: 0 }}
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyToClipboard(revealed.link)}
                            >
                              {t("admin.ops.copy")}
                            </Button>
                          </div>
                        </label>
                      )}
                      <label className="fin-field wide">
                        <span>{t("admin.ops.access_token")}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            readOnly
                            value={revealed.token}
                            dir="ltr"
                            style={{ flex: 1, minWidth: 0 }}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => copyToClipboard(revealed.token)}
                          >
                            {t("admin.ops.copy")}
                          </Button>
                        </div>
                      </label>
                      {!revealed.link && (
                        <p
                          className="fin-note"
                          style={{ gridColumn: "1 / -1" }}
                        >
                          {t("admin.ops.access_link_unavailable")}
                        </p>
                      )}
                      <p className="fin-note" style={{ gridColumn: "1 / -1" }}>
                        {t("admin.ops.access_token_note")}
                      </p>
                    </div>
                  )}
                </section>
              )}

              <section>
                <h3>{t("admin.ops.summary")}</h3>
                <Row label={t("admin.users.product")}>
                  {o.productTitle || o.productId}
                </Row>
                <Row label={t("admin.coupons.email")}>
                  <span dir="ltr">{o.customer?.email}</span>
                </Row>
                <Row label={t("admin.users.price")}>
                  <Num>{o.price == null ? "—" : fmtEgp(o.price)}</Num>
                </Row>
                {o.couponCode && (
                  <Row label={t("admin.users.coupon")}>{o.couponCode}</Row>
                )}
                {o.paymentProvider && (
                  <Row label={t("admin.ops.payment_method")}>
                    {o.paymentProvider}
                  </Row>
                )}
                <Row label={t("admin.ops.created")}>
                  <Num>{when(o.createdAt)}</Num>
                </Row>
                <Row label={t("admin.col_updated")}>
                  <Num>{when(o.updatedAt)}</Num>
                </Row>
                {o.profit != null && (
                  <Row label={t("admin.finance.col_profit")}>
                    <Num>
                      {o.estimated ? "~" : ""}
                      {fmtEgp(o.profit)}
                    </Num>
                  </Row>
                )}
              </section>

              <section>
                <h3>{t("admin.ops.history")}</h3>
                {!o.history || o.history.length === 0 ? (
                  <p className="fin-note">{t("admin.ops.no_history")}</p>
                ) : (
                  <ol className="ash-timeline">
                    {o.history.map((h, i) => (
                      <li key={i}>
                        <strong>{statusMeta(h.status)[0]}</strong>
                        <span>
                          <Num>{when(h.createdAt)}</Num>
                        </span>
                        {h.message && <em>{h.message}</em>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {o.payments && (
                <section>
                  <h3>{t("admin.ops.payments")}</h3>
                  {o.payments.length === 0 ? (
                    <p className="fin-note">{t("admin.ops.no_payments")}</p>
                  ) : (
                    o.payments.map((p) => (
                      <Row
                        key={p.id}
                        label={`${p.provider} · ${t(`admin.ops.kind_${p.kind}`)}`}
                      >
                        <Num>
                          {p.amount == null
                            ? "—"
                            : p.currency === "USD"
                              ? fmtUsd(p.amount)
                              : fmtEgp(p.amount)}
                        </Num>{" "}
                        {p.success === false ? (
                          <Badge tone="danger">{t("admin.ops.failed")}</Badge>
                        ) : null}
                        <span className="fin-sub">
                          <Num>{when(p.receivedAt)}</Num>
                          {p.transactionId ? ` · ${p.transactionId}` : ""}
                        </span>
                      </Row>
                    ))
                  )}
                </section>
              )}

              <section>
                <h3>{t("admin.ops.supplier")}</h3>
                <Row label={t("admin.ops.supplier_order")}>
                  <span className="mono">{o.mobimatterOrderId || "—"}</span>
                </Row>
                {o.lastError && (
                  <Row label={t("admin.ops.last_error")}>{o.lastError}</Row>
                )}
                {o.notifyError && (
                  <Row label={t("admin.ops.email_error")}>{o.notifyError}</Row>
                )}
                {o.sourcePrice != null && (
                  <Row label={t("admin.finance.col_cost")}>
                    <Num>{fmtUsd(o.sourcePrice)}</Num>
                  </Row>
                )}
              </section>
            </div>
          )}
        </StateBox>
      </aside>
    </>
  );
}
