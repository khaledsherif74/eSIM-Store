import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Lock, LockOpen, Plus } from "lucide-react";
import { Card } from "../../ui/Card.jsx";
import { Button } from "../../ui/Button.jsx";
import { Badge } from "../../ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import {
  CATEGORIES,
  CYCLES,
  Empty,
  KINDS,
  MonthSelect,
  Num,
  STATUSES,
  StateBox,
  currentMonth,
  errorText,
  fmtEgp,
  fmtNum,
  statusTone,
  todayCairo,
  useAsync,
} from "./financeUtils.jsx";
import "./finance.css";

const isHttp = (s) => /^https?:\/\//i.test(s || "");

function blankForm(fx) {
  return {
    name: "",
    category: "Infrastructure",
    kind: "Fixed",
    cycle: "Monthly",
    amount: "",
    currency: "EGP",
    fxRate: fx ? String(fx) : "",
    paidAt: todayCairo(),
    coverMonths: "1",
    endMonth: "",
    payee: "",
    status: "Confirmed",
    receiptRef: "",
    note: "",
  };
}

function formFromExpense(e) {
  return {
    name: e.name,
    category: e.category,
    kind: e.kind,
    cycle: e.cycle || "Monthly",
    amount: String(e.amount),
    currency: e.currency,
    fxRate: String(e.fxRate),
    paidAt: e.paidDate,
    coverMonths: String(e.coverMonths),
    endMonth: e.endMonth || "",
    payee: e.payee || "",
    status: e.status,
    receiptRef: e.receiptRef || "",
    note: e.note || "",
  };
}

function toPayload(f) {
  const fixed = f.kind === "Fixed";
  return {
    name: f.name,
    category: f.category,
    kind: f.kind,
    cycle: fixed ? f.cycle : null,
    amount: f.amount === "" ? "" : Number(f.amount),
    currency: f.currency,
    ...(f.currency === "USD" ? { fxRate: Number(f.fxRate) } : {}),
    paidAt: f.paidAt,
    coverMonths: fixed ? 1 : Number(f.coverMonths || 1),
    endMonth: fixed && f.endMonth ? f.endMonth : null,
    payee: f.payee,
    status: f.status,
    receiptRef: f.receiptRef || null,
    note: f.note,
  };
}

function ExpenseForm({ editing, fx, onSaved, onCancel }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(
    editing ? formFromExpense(editing) : blankForm(fx),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(force = false) {
    setSaving(true);
    setError("");
    try {
      const payload = { ...toPayload(form), ...(force ? { force: true } : {}) };
      if (editing) await adminApi.updateFinanceExpense(editing.id, payload);
      else await adminApi.createFinanceExpense(payload);
      onSaved();
    } catch (err) {
      if (err.status === 409 && err.body?.details?.code === "DUPLICATE_EXPENSE") {
        setSaving(false);
        if (window.confirm(t("admin.finance.duplicate_confirm"))) {
          submit(true);
        }
        return;
      }
      setError(errorText(err, t));
      setSaving(false);
    }
  }

  const fixed = form.kind === "Fixed";
  return (
    <Card>
      <h2 className="fin-card-title">
        {editing
          ? t("admin.finance.edit_expense")
          : t("admin.finance.new_expense")}
      </h2>
      <p className="fin-note" style={{ marginBlockEnd: 12 }}>
        {t("admin.finance.not_expense_note")}
      </p>
      <div
        className="fin-form"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.tagName === "INPUT" && !saving) {
            e.preventDefault();
            submit(false);
          }
        }}
      >
        <label className="fin-field">
          <span>{t("admin.finance.f_name")}</span>
          <input value={form.name} onChange={set("name")} maxLength={120} />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_category")}</span>
          <select value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`admin.finance.cat_${c}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_kind")}</span>
          <select value={form.kind} onChange={set("kind")}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`admin.finance.kind_${k}`)}
              </option>
            ))}
          </select>
        </label>
        {fixed && (
          <label className="fin-field">
            <span>{t("admin.finance.f_cycle")}</span>
            <select value={form.cycle} onChange={set("cycle")}>
              {CYCLES.map((c) => (
                <option key={c} value={c}>
                  {t(`admin.finance.cycle_${c}`)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="fin-field">
          <span>{t("admin.finance.f_amount")}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={set("amount")}
          />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_currency")}</span>
          <select value={form.currency} onChange={set("currency")}>
            <option value="EGP">EGP</option>
            <option value="USD">USD</option>
          </select>
        </label>
        {form.currency === "USD" && (
          <label className="fin-field">
            <span>{t("admin.finance.f_fx")}</span>
            <input
              type="number"
              min="0"
              step="0.0001"
              inputMode="decimal"
              value={form.fxRate}
              onChange={set("fxRate")}
            />
          </label>
        )}
        <label className="fin-field">
          <span>{t("admin.finance.f_paid_at")}</span>
          <input type="date" value={form.paidAt} onChange={set("paidAt")} />
        </label>
        {!fixed && (
          <label className="fin-field">
            <span>{t("admin.finance.f_cover")}</span>
            <input
              type="number"
              min="1"
              max="120"
              step="1"
              value={form.coverMonths}
              onChange={set("coverMonths")}
            />
          </label>
        )}
        {fixed && (
          <label className="fin-field">
            <span>{t("admin.finance.f_end_month")}</span>
            <input
              type="text"
              placeholder="YYYY-MM"
              pattern="\d{4}-\d{2}"
              dir="ltr"
              value={form.endMonth}
              onChange={set("endMonth")}
            />
          </label>
        )}
        <label className="fin-field">
          <span>{t("admin.finance.f_payee")}</span>
          <input value={form.payee} onChange={set("payee")} maxLength={120} />
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_status")}</span>
          <select value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`admin.finance.status_${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_receipt")}</span>
          <input
            value={form.receiptRef}
            onChange={set("receiptRef")}
            maxLength={300}
            placeholder={t("admin.finance.f_receipt_hint")}
          />
        </label>
        <label className="fin-field wide">
          <span>{t("admin.finance.f_note")}</span>
          <textarea value={form.note} onChange={set("note")} maxLength={500} />
        </label>
        {error && <p className="fin-form-error" role="alert">{error}</p>}
        <div className="fin-form-actions">
          <Button onClick={() => submit(false)} disabled={saving}>
            {editing ? t("admin.finance.save_changes") : t("admin.finance.save")}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            {t("admin.finance.cancel")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ExpensesTab({ role }) {
  const { t } = useTranslation();
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const params = { month, category, kind, q: search };
  const list = useAsync(
    () => adminApi.listFinanceExpenses({ ...params, page }),
    [month, category, kind, search, page],
  );
  const locks = useAsync(() => adminApi.listFinanceLocks(), []);
  const settings = useAsync(() => adminApi.getFinanceSettings(), []);

  const isLocked = Boolean(month) && (locks.data?.items || []).some((l) => l.month === month);
  const canUnlock = role === "Admin";

  function resetPage(setter) {
    return (v) => {
      setter(v);
      setPage(1);
    };
  }

  async function run(action) {
    setBusy(true);
    setActionError("");
    try {
      await action();
    } catch (err) {
      setActionError(errorText(err, t));
    } finally {
      setBusy(false);
    }
  }

  const toggleLock = () =>
    run(async () => {
      if (isLocked) {
        if (!window.confirm(t("admin.finance.unlock_confirm", { month }))) return;
        await adminApi.unlockFinanceMonth(month);
      } else {
        if (!window.confirm(t("admin.finance.lock_confirm", { month }))) return;
        await adminApi.lockFinanceMonth(month);
      }
      locks.reload();
      list.reload();
    });

  const cancelExpense = (e) =>
    run(async () => {
      if (!window.confirm(t("admin.finance.cancel_confirm", { name: e.name }))) return;
      await adminApi.updateFinanceExpense(e.id, { status: "Cancelled" });
      list.reload();
    });

  const exportCsv = () => run(() => adminApi.downloadFinanceExpensesCsv(params));

  const data = list.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="fin-wrap">
      <div className="admin-section-head">
        <h1>{t("admin.finance.expenses_title")}</h1>
        <p>{t("admin.finance.expenses_sub")}</p>
      </div>

      <div className="fin-toolbar">
        <MonthSelect
          allowAll
          value={month}
          onChange={resetPage(setMonth)}
          label={t("admin.finance.month")}
        />
        <label className="fin-field">
          <span>{t("admin.finance.f_category")}</span>
          <select value={category} onChange={(e) => resetPage(setCategory)(e.target.value)}>
            <option value="">{t("admin.finance.all")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`admin.finance.cat_${c}`)}</option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.f_kind")}</span>
          <select value={kind} onChange={(e) => resetPage(setKind)(e.target.value)}>
            <option value="">{t("admin.finance.all")}</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>{t(`admin.finance.kind_${k}`)}</option>
            ))}
          </select>
        </label>
        <label className="fin-field">
          <span>{t("admin.finance.search")}</span>
          <input
            value={q}
            maxLength={100}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(q.trim());
                setPage(1);
              }
            }}
            onBlur={() => {
              if (q.trim() !== search) {
                setSearch(q.trim());
                setPage(1);
              }
            }}
          />
        </label>
        <span className="fin-spacer" />
        {month && (
          <Badge tone={isLocked ? "warning" : "neutral"}>
            {isLocked ? <Lock size={12} /> : <LockOpen size={12} />}{" "}
            {isLocked ? t("admin.finance.locked") : t("admin.finance.open")}
          </Badge>
        )}
        {month && (!isLocked || canUnlock) && (
          <Button variant="secondary" size="sm" onClick={toggleLock} disabled={busy}>
            {isLocked ? t("admin.finance.unlock_month") : t("admin.finance.lock_month")}
          </Button>
        )}
        <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={exportCsv} disabled={busy}>
          {t("admin.finance.export_csv")}
        </Button>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          {t("admin.finance.new_expense")}
        </Button>
      </div>

      {month && isLocked && !canUnlock && (
        <p className="fin-note">{t("admin.finance.unlock_admin_only")}</p>
      )}
      {actionError && <div className="fin-alert danger" role="alert">{actionError}</div>}

      {formOpen && (
        <ExpenseForm
          key={editing ? editing.id : "new"}
          editing={editing}
          fx={settings.data?.fx?.rate}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditing(null);
            list.reload();
          }}
        />
      )}

      <Card padded={false}>
        <StateBox loading={list.loading} error={list.error} onRetry={list.reload}>
          {data && data.items.length === 0 ? (
            <Empty>{t("admin.finance.no_expenses")}</Empty>
          ) : (
            data && (
              <>
                <div className="fin-table-wrap">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>{t("admin.finance.f_paid_at")}</th>
                        <th>{t("admin.finance.f_name")}</th>
                        <th>{t("admin.finance.f_category")}</th>
                        <th>{t("admin.finance.f_kind")}</th>
                        <th className="num">{t("admin.finance.f_amount")}</th>
                        <th className="num">{t("admin.finance.amount_egp")}</th>
                        <th className="num">{t("admin.finance.share_of", { month: data.shareMonth })}</th>
                        <th>{t("admin.finance.f_status")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((e) => (
                        <tr key={e.id} className={e.status === "Cancelled" ? "fin-cancelled" : ""}>
                          <td><Num>{e.paidDate}</Num></td>
                          <td>
                            {e.name}
                            {e.payee && <span className="fin-sub">{e.payee}</span>}
                            {e.receiptRef &&
                              (isHttp(e.receiptRef) ? (
                                <a className="fin-link fin-sub" href={e.receiptRef} target="_blank" rel="noopener noreferrer">
                                  {t("admin.finance.receipt")}
                                </a>
                              ) : (
                                <span className="fin-sub">{e.receiptRef}</span>
                              ))}
                          </td>
                          <td>{t(`admin.finance.cat_${e.category}`)}</td>
                          <td>
                            {t(`admin.finance.kind_${e.kind}`)}
                            {e.kind === "Fixed" && e.cycle && (
                              <span className="fin-sub">{t(`admin.finance.cycle_${e.cycle}`)}</span>
                            )}
                            {e.kind !== "Fixed" && e.coverMonths > 1 && (
                              <span className="fin-sub">{t("admin.finance.covers_n", { count: e.coverMonths })}</span>
                            )}
                          </td>
                          <td className="num">
                            <Num>
                              {e.currency === "USD" ? `$${fmtNum(e.amount)}` : fmtEgp(e.amount)}
                            </Num>
                            {e.currency === "USD" && (
                              <span className="fin-sub"><Num>×{fmtNum(e.fxRate, 2)}</Num></span>
                            )}
                          </td>
                          <td className="num"><Num>{fmtEgp(e.amountEgp)}</Num></td>
                          <td className="num"><Num>{fmtEgp(e.monthShare)}</Num></td>
                          <td>
                            <Badge tone={statusTone(e.status)}>{t(`admin.finance.status_${e.status}`)}</Badge>
                            {e.locked && <span className="fin-sub"><Lock size={10} /> {t("admin.finance.locked")}</span>}
                          </td>
                          <td>
                            <div className="fin-row-actions">
                              <Button
                                variant="secondary"
                                size="sm"
                                disabled={e.locked || busy}
                                onClick={() => {
                                  setEditing(e);
                                  setFormOpen(true);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                              >
                                {t("admin.finance.edit")}
                              </Button>
                              {e.status !== "Cancelled" && (
                                <Button variant="danger" size="sm" disabled={e.locked || busy} onClick={() => cancelExpense(e)}>
                                  {t("admin.finance.cancel_expense")}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total">
                        <td colSpan={5}><strong>{t("admin.finance.total_confirmed")}</strong></td>
                        <td className="num"><strong><Num>{fmtEgp(data.totals.confirmedEgp)}</Num></strong></td>
                        <td className="num"><strong><Num>{fmtEgp(data.totals.opexForShareMonth)}</Num></strong></td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="admin-pagination">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    {t("admin.previous")}
                  </Button>
                  <span>{t("admin.page_of", { page, total: pages })}</span>
                  <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
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
