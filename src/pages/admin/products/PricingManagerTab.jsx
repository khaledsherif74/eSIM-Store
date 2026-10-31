import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowDown, ArrowUp, Download, Filter, History, Search, Upload, X } from "lucide-react";
import { Button } from "../../../components/ui/Button.jsx";
import { Card } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { adminApi } from "../../../services/adminApi.js";
import { Empty, Num, StateBox, fmtNum, fmtUsd, useAsync } from "../../../components/admin/finance/financeUtils.jsx";
import "./PricingManagerTab.css";

const PAGE_SIZE = 50;

const COPY = {
  en: {
    allProducts: "All products", matching: "Matching products", countries: "Countries", providers: "Providers", packages: "Package configurations",
    search: "Search products", country: "Country", provider: "Provider", category: "Package category", packageConfig: "Package (data + validity)", data: "Data", validity: "Validity", status: "Status", visibility: "Visibility", all: "All",
    active: "Active", inactive: "Inactive", visible: "Visible", hidden: "Hidden", clear: "Clear filters", download: "Export Excel", upload: "Import Excel", bulkSelected: "Bulk update selected", bulkFiltered: "Bulk update filtered", selected: "selected",
    product: "Product / Package", cost: "MobiMatter cost", selling: "Selling price", margin: "Gross margin", statusCol: "Status", details: "Details & history", belowCost: "Below cost", edit: "Edit price", open: "Open details",
    noProducts: "No products match these filters.", sort: "Sort", previous: "Previous", next: "Next", page: "Page", of: "of", package: "Package", countriesIn: "countries",
    bulkTitle: "Bulk price update", scopeSelected: "Selected products", scopeFiltered: "All products matching current filters", operation: "Update type", value: "Value", set: "Set price to", increasePercent: "Increase by %", decreasePercent: "Decrease by %", increaseFixed: "Increase by USD", decreaseFixed: "Decrease by USD", preview: "Preview update", cancel: "Cancel", confirm: "Confirm update", confirming: "Applying…",
    confirmTitle: "Confirm price update", willUpdate: "You are about to update {{count}} products.", unchanged: "Unchanged products", affected: "Products affected", oldPrice: "Current price", newPrice: "New price", showFirst: "Showing the first {{count}} changes.", noChanges: "No product prices need to change.", belowWarning: "{{count}} products will have a selling price below MobiMatter cost.", acknowledge: "I understand these products will be sold below MobiMatter cost and I want to proceed.", errorRows: "Rows that need fixing", importInvalid: "Fix the Excel errors before applying this import.", success: "Updated {{count}} product prices.", exportError: "Could not export the Excel file.", importError: "Could not read the Excel file.", updateError: "Could not update product prices.", chooseFile: "Choose an .xlsx file", exportHint: "Export the catalogue, edit only Selling Price USD, then upload the workbook to preview changes.", productDetails: "Product details", priceHistory: "Selling-price history", historyEmpty: "No admin selling-price changes have been recorded for this product yet.", currentSelling: "Current selling price", supplierCost: "MobiMatter supplier cost", gross: "Gross margin before payment fees", productId: "Product ID", dataAllowance: "Data allowance", providerId: "Provider ID", networkListId: "Network list ID", productFamilyId: "Product family ID", rank: "Supplier rank", requiresKyc: "KYC required", lastSupplierUpdate: "Last supplier update", additionalData: "Additional product data", regions: "Regions", countriesLabel: "Countries", validityDays: "Validity", categoryLabel: "Category", activeLabel: "Active", yes: "Yes", no: "No", source: "Update source", actor: "Updated by", date: "Date", from: "From", to: "To", manual: "Individual edit", bulk: "Bulk update", excel: "Excel import", migration: "Starting price at rollout", hiddenFlag: "Hidden from customers", featuredFlag: "Featured", bestSellerFlag: "Best seller", flags: "Catalogue controls", flagSaved: "Catalogue setting updated.", invalidRow: "Row {{row}} · {{productId}}: {{reason}}", note: "MobiMatter cost is shown separately and is never overwritten by the Excel import.", previewFailed: "Could not prepare the update preview.", invalidCount: "{{count}} invalid rows", noHistory: "History is retained for every individual price change.", import: "Import preview", importValid: "The file is ready to apply.", none: "—",
  },
  ar: {
    allProducts: "إجمالي المنتجات", matching: "المنتجات المطابقة", countries: "الدول", providers: "المزوّدون", packages: "تركيبات الباقات",
    search: "ابحث عن منتج", country: "الدولة", provider: "المزوّد", category: "فئة الباقة", packageConfig: "الباقة (البيانات + المدة)", data: "البيانات", validity: "المدة", status: "الحالة", visibility: "الظهور", all: "الكل",
    active: "نشط", inactive: "غير نشط", visible: "ظاهر", hidden: "مخفي", clear: "مسح الفلاتر", download: "تصدير Excel", upload: "استيراد Excel", bulkSelected: "تعديل المحدد", bulkFiltered: "تعديل نتائج الفلتر", selected: "محدد",
    product: "المنتج / الباقة", cost: "تكلفة MobiMatter", selling: "سعر البيع", margin: "هامش الربح الإجمالي", statusCol: "الحالة", details: "التفاصيل والسجل", belowCost: "أقل من التكلفة", edit: "تعديل السعر", open: "فتح التفاصيل",
    noProducts: "لا توجد منتجات تطابق الفلاتر.", sort: "ترتيب", previous: "السابق", next: "التالي", page: "صفحة", of: "من", package: "الباقة", countriesIn: "دول",
    bulkTitle: "تحديث أسعار جماعي", scopeSelected: "المنتجات المحددة", scopeFiltered: "كل المنتجات المطابقة للفلاتر", operation: "نوع التحديث", value: "القيمة", set: "تحديد السعر إلى", increasePercent: "زيادة بنسبة %", decreasePercent: "خفض بنسبة %", increaseFixed: "زيادة بمبلغ USD", decreaseFixed: "خفض بمبلغ USD", preview: "معاينة التحديث", cancel: "إلغاء", confirm: "تأكيد التحديث", confirming: "جارٍ التطبيق…",
    confirmTitle: "تأكيد تحديث الأسعار", willUpdate: "سيتم تحديث أسعار {{count}} منتج.", unchanged: "منتجات بدون تغيير", affected: "المنتجات المتأثرة", oldPrice: "السعر الحالي", newPrice: "السعر الجديد", showFirst: "عرض أول {{count}} تغييرات.", noChanges: "لا توجد أسعار تحتاج إلى تغيير.", belowWarning: "سيكون سعر البيع أقل من تكلفة MobiMatter لعدد {{count}} منتج.", acknowledge: "أفهم أن هذه المنتجات ستباع بأقل من تكلفة MobiMatter وأريد المتابعة.", errorRows: "الصفوف التي تحتاج إلى تصحيح", importInvalid: "صحح أخطاء ملف Excel قبل تطبيق الاستيراد.", success: "تم تحديث أسعار {{count}} منتج.", exportError: "تعذر تصدير ملف Excel.", importError: "تعذر قراءة ملف Excel.", updateError: "تعذر تحديث أسعار المنتجات.", chooseFile: "اختر ملف .xlsx", exportHint: "صدّر الكتالوج وعدّل عمود Selling Price USD فقط، ثم ارفع الملف لمعاينة التغييرات.", productDetails: "تفاصيل المنتج", priceHistory: "سجل أسعار البيع", historyEmpty: "لا توجد تغييرات إدارية مسجلة لسعر بيع هذا المنتج حتى الآن.", currentSelling: "سعر البيع الحالي", supplierCost: "تكلفة المورد من MobiMatter", gross: "هامش الربح قبل رسوم الدفع", productId: "معرّف المنتج", dataAllowance: "حجم البيانات", providerId: "معرّف المزوّد", networkListId: "معرّف قائمة الشبكات", productFamilyId: "معرّف عائلة المنتج", rank: "ترتيب المورّد", requiresKyc: "يتطلب تحقق الهوية", lastSupplierUpdate: "آخر تحديث من المورّد", additionalData: "بيانات المنتج الإضافية", regions: "المناطق", countriesLabel: "الدول", validityDays: "المدة", categoryLabel: "الفئة", activeLabel: "نشط", yes: "نعم", no: "لا", source: "مصدر التحديث", actor: "تم التحديث بواسطة", date: "التاريخ", from: "من", to: "إلى", manual: "تعديل فردي", bulk: "تعديل جماعي", excel: "استيراد Excel", migration: "السعر عند بدء النظام الجديد", hiddenFlag: "إخفاء من العملاء", featuredFlag: "منتج مميز", bestSellerFlag: "الأكثر مبيعاً", flags: "إعدادات ظهور المنتج", flagSaved: "تم تحديث إعداد المنتج.", invalidRow: "الصف {{row}} · {{productId}}: {{reason}}", note: "تظهر تكلفة MobiMatter بشكل منفصل ولا يتم استبدالها عند استيراد Excel.", previewFailed: "تعذرت معاينة التحديث.", invalidCount: "{{count}} صف غير صالح", noHistory: "يتم الاحتفاظ بسجل لكل تغيير فردي في السعر.", import: "معاينة الاستيراد", importValid: "الملف جاهز للتطبيق.", none: "—",
  },
};

function formatCopy(template, values = {}) {
  return Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{{${key}}}`, String(value)), template);
}

function getCopy(language) {
  const code = String(language || "en").split("-")[0].toLowerCase();
  return COPY[code] || COPY.en;
}

function FilterLabel({ title, children }) {
  return <label className="fin-field"><span>{title}</span>{children}</label>;
}

function PriceMetric({ label, value, tone }) {
  return (
    <div className="pricing-manager-metric">
      <span>{label}</span>
      <strong className={tone || ""}><Num>{value}</Num></strong>
    </div>
  );
}

function ProductDetailsModal({ productId, copy, onClose, onPreviewPrice, onFlagsUpdated }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [flagBusy, setFlagBusy] = useState("");
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    adminApi.getProductPriceHistory(productId)
      .then((result) => {
        if (!alive) return;
        setData(result);
        setPrice(Number(result.product.price).toFixed(2));
      })
      .catch((err) => alive && setError(err.message || copy.updateError))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [productId, copy.updateError]);

  async function toggleFlag(flag) {
    if (!data?.product) return;
    setFlagBusy(flag);
    setError("");
    try {
      const nextValue = !data.product[flag];
      await adminApi.updateProduct(productId, { [flag]: nextValue });
      setData((current) => ({ ...current, product: { ...current.product, [flag]: nextValue } }));
      onFlagsUpdated?.();
    } catch (err) {
      setError(err.message || copy.updateError);
    } finally {
      setFlagBusy("");
    }
  }

  async function preview() {
    setBusy(true);
    try {
      const outcome = await onPreviewPrice(productId, price);
      if (outcome?.ok) onClose();
      else if (outcome?.error) setError(outcome.error);
    } finally {
      setBusy(false);
    }
  }

  const product = data?.product;
  return (
    <div className="pricing-manager-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="pricing-manager-dialog pricing-manager-product-dialog" role="dialog" aria-modal="true" aria-labelledby="pricing-product-title">
        <header className="pricing-manager-dialog-head">
          <div><span className="fin-sub">{copy.productDetails}</span><h2 id="pricing-product-title">{product?.title || productId}</h2></div>
          <button className="pricing-manager-icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {loading ? <div className="pricing-manager-loading">Loading…</div> : error ? <div className="fin-alert danger">{error}</div> : product && (
          <div className="pricing-manager-dialog-body">
            <div className="pricing-manager-detail-grid">
              <div><span>{copy.productId}</span><strong className="pricing-manager-code">{product.productId}</strong></div>
              <div><span>{copy.provider}</span><strong>{product.providerName || copy.none}</strong></div>
              <div><span>{copy.providerId}</span><strong>{product.providerId ?? copy.none}</strong></div>
              <div><span>{copy.categoryLabel}</span><strong>{product.category || copy.none}</strong></div>
              <div><span>{copy.dataAllowance}</span><strong>{product.dataLimit == null ? copy.none : `${product.dataLimit} ${product.dataUnit || ""}`}</strong></div>
              <div><span>{copy.validityDays}</span><strong>{product.validityDays == null ? copy.none : `${product.validityDays} days`}</strong></div>
              <div><span>{copy.countriesLabel}</span><strong>{(product.countries || []).join(", ") || copy.none}</strong></div>
              <div><span>{copy.regions}</span><strong>{(product.regions || []).map((region) => typeof region === "string" ? region : region?.name || region?.regionName || "").filter(Boolean).join(", ") || copy.none}</strong></div>
              <div><span>{copy.networkListId}</span><strong>{product.networkListId ?? copy.none}</strong></div>
              <div><span>{copy.productFamilyId}</span><strong>{product.productFamilyId ?? copy.none}</strong></div>
              <div><span>{copy.rank}</span><strong>{product.rank ?? copy.none}</strong></div>
              <div><span>{copy.requiresKyc}</span><strong>{product.requiresKyc ? copy.yes : copy.no}</strong></div>
              <div><span>{copy.activeLabel}</span><strong>{product.active ? copy.yes : copy.no}</strong></div>
              <div><span>{copy.lastSupplierUpdate}</span><strong>{product.sourceUpdatedAt ? new Date(product.sourceUpdatedAt).toLocaleString() : copy.none}</strong></div>
            </div>
            <div className="pricing-manager-flags">
              <strong>{copy.flags}</strong>
              <div>
                {[["hidden", copy.hiddenFlag], ["featured", copy.featuredFlag], ["bestSeller", copy.bestSellerFlag]].map(([flag, label]) => (
                  <Button key={flag} size="sm" variant={product[flag] ? "primary" : "secondary"} disabled={Boolean(flagBusy)} aria-pressed={Boolean(product[flag])} onClick={() => toggleFlag(flag)}>{label}: {product[flag] ? copy.yes : copy.no}</Button>
                ))}
              </div>
            </div>
            <div className="pricing-manager-current-prices">
              <PriceMetric label={copy.supplierCost} value={product.sourcePrice == null ? copy.none : fmtUsd(product.sourcePrice)} />
              <PriceMetric label={copy.currentSelling} value={fmtUsd(product.price)} />
              <PriceMetric label={copy.gross} value={product.grossMargin == null ? copy.none : fmtUsd(product.grossMargin)} tone={product.grossMargin != null && product.grossMargin < 0 ? "is-negative" : ""} />
            </div>
            <div className="pricing-manager-edit-line">
              <label className="fin-field"><span>{copy.selling} (USD)</span><input inputMode="decimal" type="number" min="0.01" max="1000000" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
              <Button size="sm" disabled={busy || !price || Number(price) <= 0} onClick={preview}>{copy.edit}</Button>
            </div>
            {(product.rawDetails?.length > 0 || product.tags?.length || product.capabilities || product.displayAttributes || product.description) && (
              <details className="pricing-manager-raw-details"><summary>{copy.additionalData}</summary>
                {product.rawDetails?.length > 0 && <div className="pricing-manager-raw-grid">{product.rawDetails.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}</span><strong>{typeof item.value === "object" ? JSON.stringify(item.value) : String(item.value ?? "—")}</strong></div>)}</div>}
                <pre className="pricing-manager-json">{JSON.stringify({ tags: product.tags, capabilities: product.capabilities, description: product.description, displayAttributes: product.displayAttributes }, null, 2)}</pre>
              </details>
            )}
            <div className="pricing-manager-history-head"><h3><History size={17} /> {copy.priceHistory}</h3><span>{copy.noHistory}</span></div>
            {data.history.length === 0 ? <p className="fin-note">{copy.historyEmpty}</p> : (
              <div className="fin-table-wrap">
                <table className="admin-orders-table pricing-manager-history-table">
                  <thead><tr><th>{copy.date}</th><th className="num">{copy.from}</th><th className="num">{copy.to}</th><th>{copy.source}</th><th>{copy.actor}</th></tr></thead>
                  <tbody>{data.history.map((row) => <tr key={row.id}><td>{new Date(row.createdAt).toLocaleString()}</td><td className="num"><Num>{row.oldPrice == null ? copy.none : fmtUsd(row.oldPrice)}</Num></td><td className="num"><strong><Num>{fmtUsd(row.newPrice)}</Num></strong></td><td>{copy[row.changeSource] || row.changeSource}</td><td>{row.actor || copy.none}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <footer className="pricing-manager-dialog-foot"><Button variant="secondary" onClick={onClose}>{copy.cancel}</Button></footer>
      </section>
    </div>
  );
}

function ConfirmationDialog({ preview, source, copy, busy, error, acknowledge, setAcknowledge, onClose, onConfirm }) {
  if (!preview) return null;
  const canApply = preview.totalChanges > 0 && !preview.invalidRows?.length && (preview.belowCostCount === 0 || acknowledge) && !busy;
  const changes = preview.changes || [];
  return (
    <div className="pricing-manager-overlay pricing-manager-confirm-layer" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="pricing-manager-dialog pricing-manager-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="pricing-confirm-title">
        <header className="pricing-manager-dialog-head">
          <div><span className="fin-sub">{copy[source] || copy.bulkTitle}</span><h2 id="pricing-confirm-title">{copy.confirmTitle}</h2></div>
          <button className="pricing-manager-icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="pricing-manager-dialog-body">
          {preview.invalidRows?.length > 0 ? (
            <>
              <div className="fin-alert danger"><AlertTriangle size={18} /> {formatCopy(copy.invalidCount, { count: preview.invalidRows.length })}. {copy.importInvalid}</div>
            <ul className="pricing-manager-invalid-list">
              {preview.invalidRows.slice(0, 30).map((row, index) => (
                <li key={`${row.row || "unknown"}-${row.productId || ""}-${index}`}>{formatCopy(copy.invalidRow, { row: row.row ?? "—", productId: row.productId || "—", reason: row.reason })}</li>
              ))}
            </ul>
              {preview.invalidRows.length > 30 && <p className="fin-note">And {preview.invalidRows.length - 30} more invalid rows.</p>}
            </>
          ) : (
            <>
              <p className="pricing-manager-confirm-count">{formatCopy(copy.willUpdate, { count: preview.totalChanges })}</p>
              <div className="pricing-manager-confirm-stats"><div><span>{copy.affected}</span><strong>{fmtNum(preview.totalChanges, 0)}</strong></div><div><span>{copy.unchanged}</span><strong>{fmtNum(preview.unchanged || 0, 0)}</strong></div><div><span>{copy.belowCost}</span><strong className={preview.belowCostCount > 0 ? "is-negative" : ""}>{fmtNum(preview.belowCostCount || 0, 0)}</strong></div></div>
              {preview.belowCostCount > 0 && (
                <div className="pricing-manager-below-warning"><AlertTriangle size={19} /><div><strong>{formatCopy(copy.belowWarning, { count: preview.belowCostCount })}</strong><label><input type="checkbox" checked={acknowledge} onChange={(event) => setAcknowledge(event.target.checked)} /> {copy.acknowledge}</label></div></div>
              )}
              <div className="pricing-manager-preview-table-wrap">
                <table className="admin-orders-table"><thead><tr><th>{copy.product}</th><th className="num">{copy.cost}</th><th className="num">{copy.oldPrice}</th><th className="num">{copy.newPrice}</th></tr></thead><tbody>
                  {changes.slice(0, 50).map((row) => <tr key={row.productId} className={row.belowCost ? "pricing-manager-row-below" : ""}><td><strong>{row.title}</strong><span className="fin-sub">{row.providerName || row.productId} · {(row.countries || []).slice(0, 2).join(", ")}</span></td><td className="num"><Num>{row.sourcePrice == null ? "—" : fmtUsd(row.sourcePrice)}</Num></td><td className="num"><Num>{fmtUsd(row.oldPrice)}</Num></td><td className="num"><strong><Num>{fmtUsd(row.newPrice)}</Num></strong></td></tr>)}
                </tbody></table>
              </div>
              {changes.length > 50 && <p className="fin-note">{formatCopy(copy.showFirst, { count: 50 })} {changes.length - 50} more products will also be updated.</p>}
              {source === "excel" && <p className="fin-note">{copy.note}</p>}
            </>
          )}
          {error && <div className="fin-alert danger" role="alert">{error}</div>}
        </div>
        <footer className="pricing-manager-dialog-foot"><Button variant="secondary" disabled={busy} onClick={onClose}>{copy.cancel}</Button><Button disabled={!canApply} onClick={onConfirm}>{busy ? copy.confirming : copy.confirm}</Button></footer>
      </section>
    </div>
  );
}

export function PricingManagerTab() {
  const { i18n } = useTranslation();
  const copy = useMemo(() => getCopy(i18n.resolvedLanguage || i18n.language), [i18n.language, i18n.resolvedLanguage]);
  const [queryInput, setQueryInput] = useState("");
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [providerId, setProviderId] = useState("");
  const [category, setCategory] = useState("");
  const [packageKey, setPackageKey] = useState("");
  const [active, setActive] = useState("");
  const [hidden, setHidden] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [detailId, setDetailId] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSelection, setBulkSelection] = useState(null);
  const [operation, setOperation] = useState("SET");
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewSource, setPreviewSource] = useState("manual");
  const [acknowledge, setAcknowledge] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const filters = useMemo(() => ({ q, country, providerId, category, packageKey, active, hidden }), [q, country, providerId, category, packageKey, active, hidden]);
  const { data, loading, error, reload } = useAsync(
    () => adminApi.listProducts({ ...filters, sortBy, sortOrder, page, pageSize: PAGE_SIZE }),
    [q, country, providerId, category, packageKey, active, hidden, sortBy, sortOrder, page],
  );
  const pages = data?.pages || 1;

  function commitSearch() { setQ(queryInput.trim()); setPage(1); setSelected(new Set()); }
  function clearFilters() {
    setQueryInput(""); setQ(""); setCountry(""); setProviderId(""); setCategory(""); setPackageKey(""); setActive(""); setHidden(""); setPage(1); setSelected(new Set());
  }
  function updateFilter(setter, next) { setter(next); setPage(1); setSelected(new Set()); }
  function changeSort(key) {
    if (sortBy === key) setSortOrder((old) => old === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortOrder("asc"); }
  }
  function toggleOne(id) {
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function togglePage() {
    const ids = (data?.items || []).map((row) => row.productId);
    setSelected((old) => {
      const next = new Set(old);
      const allChecked = ids.length > 0 && ids.every((id) => next.has(id));
      ids.forEach((id) => allChecked ? next.delete(id) : next.add(id));
      return next;
    });
  }

  async function beginPreview(body, source) {
    setBusy(true); setPreviewError(""); setAcknowledge(false); setNotice("");
    try {
      const result = await adminApi.previewProductPriceUpdate(body);
      setPreviewSource(source);
      if (result.totalChanges === 0) {
        setPreview(null);
        setPreviewError(copy.noChanges);
        return { ok: false, error: copy.noChanges };
      }
      setPreview(result);
      setPreviewError("");
      return { ok: true };
    } catch (err) {
      const message = err.message || copy.previewFailed;
      setPreview(null); setPreviewError(message);
      return { ok: false, error: message };
    } finally { setBusy(false); }
  }

  async function previewSingle(productId, nextPrice) {
    return beginPreview({ productIds: [productId], operation: "SET", value: nextPrice }, "manual");
  }
  async function previewBulk() {
    const body = {
      operation,
      value,
      ...(bulkSelection?.productIds ? { productIds: bulkSelection.productIds } : { filters }),
    };
    await beginPreview(body, bulkSelection?.source || "bulk");
    setBulkOpen(false);
  }

  async function onFilePicked(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true); setPreviewError(""); setAcknowledge(false); setNotice("");
    try {
      const result = await adminApi.previewProductPricingExcel(file);
      setPreviewSource("excel");
      if (!result.invalidRows?.length && !result.totalChanges) {
        setPreview(null);
        setPreviewError(copy.noChanges);
      } else {
        setPreview(result);
        if (result.invalidRows?.length) setPreviewError(copy.importInvalid);
        else setPreviewError("");
      }
    } catch (err) {
      setPreview(null); setPreviewError(err.message || copy.importError);
    } finally { setBusy(false); }
  }

  async function confirmUpdate() {
    if (!preview?.changes?.length) return;
    setApplying(true); setPreviewError("");
    try {
      const result = await adminApi.applyProductPriceChanges({
        source: previewSource,
        changes: preview.changes.map((row) => ({
          productId: row.productId,
          oldPrice: row.oldPrice,
          newPrice: row.newPrice,
          sourcePrice: row.sourcePrice,
          currency: row.currency,
        })),
        acknowledgeBelowCost: acknowledge,
      });
      setPreview(null); setSelected(new Set()); setNotice(formatCopy(copy.success, { count: result.updated }));
      reload();
    } catch (err) {
      setPreviewError(err.message || copy.updateError);
    } finally { setApplying(false); }
  }

  async function exportExcel() {
    setBusy(true); setNotice("");
    try { await adminApi.downloadProductPricingExcel(); }
    catch (err) { setNotice(err.message || copy.exportError); }
    finally { setBusy(false); }
  }

  function openBulk(productIds, source) {
    setBulkSelection(productIds ? { productIds, source } : { source });
    setOperation("SET"); setValue(""); setBulkOpen(true);
  }

  const pageItems = data?.items || [];
  const pageAllSelected = pageItems.length > 0 && pageItems.every((row) => selected.has(row.productId));
  const activeFilters = Boolean(q || country || providerId || category || packageKey || active || hidden);

  return (
    <div className="fin-wrap pricing-manager">
      <div className="pricing-manager-toolbar">
        <div className="pricing-manager-toolbar-copy"><h2>Product pricing management</h2><p className="fin-note">{copy.exportHint}</p></div>
        <div className="pricing-manager-actions">
          <Button variant="secondary" size="sm" disabled={busy} onClick={exportExcel}><Download size={15} /> {copy.download}</Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload size={15} /> {copy.upload}</Button>
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={onFilePicked} />
        </div>
      </div>
      {notice && <div className="fin-alert info" role="status">{notice}</div>}
      {previewError && !preview && <div className="fin-alert danger" role="alert">{previewError}</div>}
      {data?.summary && (
        <div className="pricing-manager-kpis">
          <div className="pricing-manager-kpi"><span>{copy.allProducts}</span><strong>{fmtNum(data.summary.allProducts, 0)}</strong></div>
          <div className="pricing-manager-kpi"><span>{copy.matching}</span><strong>{fmtNum(data.summary.matchingProducts, 0)}</strong></div>
          <div className="pricing-manager-kpi"><span>{copy.countries}</span><strong>{fmtNum(data.summary.countries, 0)}</strong></div>
          <div className="pricing-manager-kpi"><span>{copy.providers}</span><strong>{fmtNum(data.summary.providers, 0)}</strong></div>
          <div className="pricing-manager-kpi"><span>{copy.packages}</span><strong>{fmtNum(data.summary.packageConfigurations, 0)}</strong></div>
        </div>
      )}
      <Card>
        <div className="pricing-manager-filter-heading"><div><Filter size={16} /><strong>Filters & sorting</strong></div>{activeFilters && <button type="button" className="pricing-manager-text-button" onClick={clearFilters}>{copy.clear}</button>}</div>
        <div className="pricing-manager-filters">
          <FilterLabel title={copy.search}><div className="pricing-manager-search"><Search size={15} /><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && commitSearch()} placeholder="Product, ID or provider" /><button type="button" onClick={commitSearch}>{copy.search}</button></div></FilterLabel>
          <FilterLabel title={copy.country}><select value={country} onChange={(event) => updateFilter(setCountry, event.target.value)}><option value="">{copy.all}</option>{data?.facets?.countries?.map((item) => <option key={item.code} value={item.code}>{item.code} ({item.count})</option>)}</select></FilterLabel>
          <FilterLabel title={copy.provider}><select value={providerId} onChange={(event) => updateFilter(setProviderId, event.target.value)}><option value="">{copy.all}</option>{data?.facets?.providers?.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.count})</option>)}</select></FilterLabel>
          <FilterLabel title={copy.category}><select value={category} onChange={(event) => updateFilter(setCategory, event.target.value)}><option value="">{copy.all}</option>{data?.facets?.categories?.map((item) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}</select></FilterLabel>
          <FilterLabel title={copy.packageConfig}><select value={packageKey} onChange={(event) => updateFilter(setPackageKey, event.target.value)}><option value="">{copy.all}</option>{data?.facets?.packages?.map((item) => <option key={item.key} value={item.key}>{item.label} ({item.count})</option>)}</select></FilterLabel>
          <FilterLabel title={copy.status}><select value={active} onChange={(event) => updateFilter(setActive, event.target.value)}><option value="">{copy.all}</option><option value="true">{copy.active}</option><option value="false">{copy.inactive}</option></select></FilterLabel>
          <FilterLabel title={copy.visibility}><select value={hidden} onChange={(event) => updateFilter(setHidden, event.target.value)}><option value="">{copy.all}</option><option value="false">{copy.visible}</option><option value="true">{copy.hidden}</option></select></FilterLabel>
        </div>
      </Card>
      <div className="pricing-manager-bulkbar">
        <span>{selected.size ? `${fmtNum(selected.size, 0)} ${copy.selected}` : ""}</span>
        <div className="pricing-manager-actions">
          <Button size="sm" variant="secondary" disabled={!selected.size || busy} onClick={() => openBulk([...selected], "bulk")}>{copy.bulkSelected} ({selected.size})</Button>
          <Button size="sm" disabled={!data?.total || busy} onClick={() => openBulk(null, "bulk")}>{copy.bulkFiltered} ({fmtNum(data?.total || 0, 0)})</Button>
        </div>
      </div>
      <Card padded={false}>
        <StateBox loading={loading || busy} error={error} onRetry={reload}>
          {!loading && data && pageItems.length === 0 ? <Empty>{copy.noProducts}</Empty> : data && (
            <>
              <div className="fin-table-wrap pricing-manager-table-wrap">
                <table className="admin-orders-table pricing-manager-table">
                  <thead><tr>
                    <th><input type="checkbox" aria-label="Select current page" checked={pageAllSelected} onChange={togglePage} /></th>
                    <th><button type="button" onClick={() => changeSort("title")}>{copy.product}{sortBy === "title" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th><button type="button" onClick={() => changeSort("country")}>{copy.country}{sortBy === "country" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th><button type="button" onClick={() => changeSort("provider")}>{copy.provider}{sortBy === "provider" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th><button type="button" onClick={() => changeSort("category")}>{copy.category}{sortBy === "category" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th className="num"><button type="button" onClick={() => changeSort("dataLimit")}>{copy.data}{sortBy === "dataLimit" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th className="num"><button type="button" onClick={() => changeSort("validityDays")}>{copy.validity}{sortBy === "validityDays" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th className="num"><button type="button" onClick={() => changeSort("sourcePrice")}>{copy.cost}{sortBy === "sourcePrice" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th className="num"><button type="button" onClick={() => changeSort("price")}>{copy.selling}{sortBy === "price" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th className="num"><button type="button" onClick={() => changeSort("grossMargin")}>{copy.margin}{sortBy === "grossMargin" && (sortOrder === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}</button></th>
                    <th>{copy.flags}</th>
                    <th>{copy.details}</th>
                  </tr></thead>
                  <tbody>{pageItems.map((product) => (
                    <tr key={product.productId} className={product.belowCost ? "pricing-manager-row-below" : ""}>
                      <td><input type="checkbox" checked={selected.has(product.productId)} onChange={() => toggleOne(product.productId)} aria-label={`Select ${product.title}`} /></td>
                      <td><button type="button" className="pricing-manager-product-link" onClick={() => setDetailId(product.productId)}>{product.title}</button><span className="fin-sub pricing-manager-product-id">{product.productId}</span>{!product.active && <Badge tone="neutral">{copy.inactive}</Badge>}</td>
                      <td><span className="pricing-manager-country-tags">{(product.countries || []).slice(0, 3).join(", ") || copy.none}</span>{product.countries?.length > 3 && <span className="fin-sub">+{product.countries.length - 3} {copy.countriesIn}</span>}</td>
                      <td>{product.providerName || copy.none}<span className="fin-sub">{product.providerId == null ? "" : `ID: ${product.providerId}`}</span></td>
                      <td>{product.category || copy.none}</td>
                      <td className="num"><Num>{product.dataLimit == null ? copy.none : `${fmtNum(product.dataLimit, product.dataLimit % 1 ? 1 : 0)} ${product.dataUnit || ""}`}</Num></td>
                      <td className="num"><Num>{product.validityDays == null ? copy.none : `${product.validityDays}d`}</Num></td>
                      <td className="num"><Num>{product.sourcePrice == null ? copy.none : fmtUsd(product.sourcePrice)}</Num></td>
                      <td className="num"><strong><Num>{fmtUsd(product.price)}</Num></strong></td>
                      <td className={`num ${product.grossMargin != null && product.grossMargin < 0 ? "is-negative" : "is-positive"}`}>{product.grossMargin == null ? copy.none : <Num>{fmtUsd(product.grossMargin)}</Num>}{product.belowCost && <span className="pricing-manager-below-label">{copy.belowCost}</span>}</td>
                      <td><div className="pricing-manager-flag-summary">{product.hidden && <Badge tone="neutral">{copy.hidden}</Badge>}{product.featured && <Badge tone="info">{copy.featuredFlag}</Badge>}{product.bestSeller && <Badge tone="success">{copy.bestSellerFlag}</Badge>}{!product.hidden && !product.featured && !product.bestSeller && <span className="fin-sub">{copy.none}</span>}</div></td>
                      <td><button type="button" className="pricing-manager-icon-link" onClick={() => setDetailId(product.productId)} title={copy.open}><History size={16} /> <span>{copy.open}</span></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="admin-pagination"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((old) => old - 1)}>{copy.previous}</Button><span>{copy.page} {page} {copy.of} {pages} · {fmtNum(data.total, 0)} {copy.matching.toLowerCase()}</span><Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((old) => old + 1)}>{copy.next}</Button></div>
            </>
          )}
        </StateBox>
      </Card>
      <p className="fin-note">{copy.note}</p>

      {detailId && <ProductDetailsModal productId={detailId} copy={copy} onClose={() => setDetailId(null)} onPreviewPrice={previewSingle} onFlagsUpdated={reload} />}
      {bulkOpen && (
        <div className="pricing-manager-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setBulkOpen(false)}>
          <section className="pricing-manager-dialog pricing-manager-bulk-dialog" role="dialog" aria-modal="true" aria-labelledby="pricing-bulk-title">
            <header className="pricing-manager-dialog-head"><div><span className="fin-sub">{bulkSelection?.productIds ? copy.scopeSelected : copy.scopeFiltered}</span><h2 id="pricing-bulk-title">{copy.bulkTitle}</h2></div><button className="pricing-manager-icon-button" type="button" onClick={() => setBulkOpen(false)} aria-label="Close"><X size={18} /></button></header>
            <div className="pricing-manager-dialog-body"><div className="pricing-manager-bulk-summary">{bulkSelection?.productIds ? `${bulkSelection.productIds.length} ${copy.selected}` : `${data?.total || 0} ${copy.matching.toLowerCase()}`}</div>
              <div className="pricing-manager-bulk-form"><FilterLabel title={copy.operation}><select value={operation} onChange={(event) => setOperation(event.target.value)}><option value="SET">{copy.set}</option><option value="INCREASE_PERCENT">{copy.increasePercent}</option><option value="DECREASE_PERCENT">{copy.decreasePercent}</option><option value="INCREASE_FIXED">{copy.increaseFixed}</option><option value="DECREASE_FIXED">{copy.decreaseFixed}</option></select></FilterLabel><FilterLabel title={`${copy.value} ${operation.endsWith("_PERCENT") ? "%" : "USD"}`}><input type="number" min="0.01" max="1000000" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} /></FilterLabel></div>
              <p className="fin-note">The system calculates each selected package independently from its current selling price. A confirmation preview is required before anything is saved.</p>
            </div>
            <footer className="pricing-manager-dialog-foot"><Button variant="secondary" onClick={() => setBulkOpen(false)}>{copy.cancel}</Button><Button disabled={!value || Number(value) <= 0 || busy} onClick={previewBulk}>{busy ? "Loading…" : copy.preview}</Button></footer>
          </section>
        </div>
      )}
      {preview && <ConfirmationDialog preview={preview} source={previewSource} copy={copy} busy={applying} error={previewError} acknowledge={acknowledge} setAcknowledge={setAcknowledge} onClose={() => { if (!applying) { setPreview(null); setPreviewError(""); } }} onConfirm={confirmUpdate} />}
    </div>
  );
}
