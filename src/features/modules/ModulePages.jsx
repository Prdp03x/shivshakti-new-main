import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Download,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";
import { api } from "../../api/client.js";
import {
  formatDate,
  formatMoney,
  formatQty,
} from "../../shared/utils/format.js";
import PrintSizeControl from "../../shared/print/PrintSizeControl.jsx";
import BillPrint from "../../shared/print/BillPrint.jsx";
import TransactionReportPrint from "../../shared/print/TransactionReportPrint.jsx";

const TX = {
  purchase: {
    label: "Purchase",
    party: "Supplier",
    side: "Credit",
    stock: "Increase",
    tone: "bg-blue-50 text-blue-800 border-blue-200",
  },
  sale: {
    label: "Sale",
    party: "Supplier",
    side: "Debit",
    stock: "No change",
    tone: "bg-violet-50 text-violet-800 border-violet-200",
  },
  debit: {
    label: "Debit Entry",
    party: "Customer",
    side: "Debit",
    stock: "Decrease",
    tone: "bg-rose-50 text-rose-800 border-rose-200",
  },
  credit: {
    label: "Credit Entry",
    party: "Customer",
    side: "Credit",
    stock: "No change",
    tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
};
const panel = "border border-slate-300 bg-white";
const input =
  "h-8 w-full border border-slate-300 bg-white px-2 text-[13px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100";
const btn =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const primary =
  "inline-flex h-8 items-center justify-center gap-1.5 border border-[#1d477b] bg-[#244f86] px-3 text-xs font-medium text-white hover:bg-[#1b3f6e] disabled:opacity-50";
const label =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const money = (n) => formatMoney(Number(n) || 0);

function Header({ title, subtitle, actions }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h1 className="text-[17px] font-semibold text-[#1b2f4a]">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="no-print flex flex-wrap gap-1.5">{actions}</div>
    </div>
  );
}
function Panel({ title, right, children }) {
  return (
    <section className={`${panel} min-w-0`}>
      <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-700">
        {title}
        {right}
      </div>
      {children}
    </section>
  );
}
function ErrorBox({ children }) {
  return children ? (
    <div className="mb-2 border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-700">
      {children}
    </div>
  ) : null;
}
function Empty({ children }) {
  return (
    <div className="px-3 py-8 text-center text-[13px] text-slate-500">
      {children}
    </div>
  );
}
function Badge({ type }) {
  const t = TX[type] || {
    label: type,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex whitespace-nowrap border px-1.5 py-0.5 text-[10px] font-semibold ${t.tone}`}
    >
      {t.label}
    </span>
  );
}
function csv(name, rows) {
  const body = rows
    .map((r) =>
      r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  const u = URL.createObjectURL(
    new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}
function useLoad(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    api
      .get(path)
      .then((v) => {
        if (live) {
          setData(v);
          setError("");
        }
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [path, tick]);
  return {
    data,
    error,
    setError,
    loading,
    refresh: () => setTick((x) => x + 1),
  };
}
function ExportActions({ rows, name, target = "records", printerDefault = false }) {
  return (
    <>
      <PrintSizeControl target={target} label={printerDefault ? "Print Report" : "Print"} usePrinterDefault={printerDefault} />
      <button className={btn} onClick={() => csv(name, rows)}>
        <Download size={13} /> Export CSV
      </button>
    </>
  );
}

export function TransactionRecordsPage({ fixedType, title, subtitle }) {
  const { data, error, loading, refresh } = useLoad("/transactions?limit=500");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [q, setQ] = useState(""),
    [type, setType] = useState(fixedType || ""),
    [detail, setDetail] = useState(null);
  const rows = useMemo(
    () =>
      (data ?? [])
        .filter(
          (t) =>
            (!fixedType || t.type === fixedType) &&
            (!type || t.type === type) &&
            (!from || t.date >= from) &&
            (!to || t.date <= to) &&
            (!q ||
              `${t.voucherNo} ${t.partyName} ${t.notes} ${t.accountName} ${t.paymentMode ?? ""} ${(t.items ?? []).map((i) => i.name).join(" ")}`
                .toLowerCase()
                .includes(q.toLowerCase())),
        )
        .sort((a, b) =>
          `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`),
        ),
    [data, fixedType, type, from, to, q],
  );
  const debit = rows.reduce(
      (s, t) => s + (TX[t.type]?.side === "Debit" ? t.amount : 0),
      0,
    ),
    credit = rows.reduce(
      (s, t) => s + (TX[t.type]?.side === "Credit" ? t.amount : 0),
      0,
    );
  const exportRows = [
    [
      "Date",
      "Voucher No",
      "Type",
      "Party",
      "Party Type",
      "Details",
      "Account",
      "Payment Mode",
      "Notes",
      "Debit",
      "Credit",
    ],
    ...rows.map((t) => [
      t.date,
      t.voucherNo,
      TX[t.type]?.label,
      t.partyName,
      t.partyType,
      (t.items ?? [])
        .map((i) => `${i.name} ${i.qty} ${i.unit} @ ${i.rate}`)
        .join("; ") || "Payment",
      t.accountName,
      t.paymentMode,
      t.notes,
      TX[t.type]?.side === "Debit" ? t.amount : "",
      TX[t.type]?.side === "Credit" ? t.amount : "",
    ]),
    ["", "", "", "", "", "", "", "", "TOTAL", debit, credit],
  ];
  const entryPath = {
    purchase: "/purchase/entry",
    sale: "/sale/new",
    debit: "/ledger/debit",
    credit: "/ledger/credit",
  };
  return (
    <div>
      <Header
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <ExportActions
              rows={exportRows}
              name={`${fixedType || "all"}-records.csv`}
              target={fixedType === "purchase" || fixedType === "sale" ? `${fixedType}-report` : "records"}
              printerDefault={fixedType === "purchase" || fixedType === "sale"}
            />
            {fixedType && (
              <Link className={primary} to={entryPath[fixedType]}>
                <Plus size={13} /> New Entry
              </Link>
            )}
          </>
        }
      />
      <ErrorBox>{error}</ErrorBox>
      <div
        className={`${panel} no-print mb-2 flex flex-wrap items-end gap-2 p-3`}
      >
        <label>
          <span className={label}>From</span>
          <input
            className={`${input} w-36`}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          <span className={label}>To</span>
          <input
            className={`${input} w-36`}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        {!fixedType && (
          <label>
            <span className={label}>Type</span>
            <select
              className={`${input} w-40`}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              {Object.entries(TX).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="min-w-48 flex-1">
          <span className={label}>Search</span>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2 top-2 text-slate-400"
            />
            <input
              className={`${input} pl-7`}
              placeholder="Voucher, party, item, notes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </label>
        <button
          className={btn}
          onClick={() => {
            setFrom("");
            setTo("");
            setQ("");
            setType(fixedType || "");
          }}
        >
          Reset
        </button>
      </div>
      <section className="print-target-records">
        <div className="hidden print-only mb-3 border-b border-black pb-2">
          <h2 className="text-lg font-bold">SHIVSHAKTI BILLING</h2>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs">
            {from ? `From ${formatDate(from)}` : "All dates"}
            {to ? ` · To ${formatDate(to)}` : ""}
            {q ? ` · Search: ${q}` : ""}
          </p>
        </div>
        <Panel
          title={`${title} · ${loading ? "Loading…" : `${rows.length} record(s)`}`}
          right={
            <button
              className="no-print text-slate-500"
              onClick={refresh}
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          }
        >
          {loading ? (
            <Empty>Loading records…</Empty>
          ) : (
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full min-w-[950px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-slate-100 text-left text-[10px] uppercase tracking-wide text-slate-600">
                  <tr>
                    {[
                      "Date",
                      "Voucher No",
                      ...(!fixedType ? ["Type"] : []),
                      "Party",
                      "Details",
                      "Account",
                      "Notes",
                      "Debit",
                      "Credit",
                      "View",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`border-b border-slate-300 px-2.5 py-2 ${["Debit", "Credit"].includes(h) ? "text-right" : ""} ${h === "View" ? "no-print" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t, i) => (
                    <tr
                      key={t.id || t._id}
                      className={`border-b border-slate-200 hover:bg-blue-50/60 ${i % 2 ? "bg-slate-50/60" : "bg-white"}`}
                    >
                      <td className="whitespace-nowrap px-2.5 py-2">
                        {formatDate(t.date)}
                      </td>
                      <td className="whitespace-nowrap px-2.5 py-2 font-mono font-medium">
                        {t.voucherNo}
                      </td>
                      {!fixedType && (
                        <td className="px-2.5 py-2">
                          <Badge type={t.type} />
                        </td>
                      )}
                      <td className="px-2.5 py-2 font-medium text-[#1f4e8c]">
                        {t.partyName}
                      </td>
                      <td className="px-2.5 py-2">
                        {t.items?.length
                          ? `${t.items.length} item(s)`
                          : t.paymentMode || "Payment"}
                      </td>
                      <td className="px-2.5 py-2">{t.accountName || "—"}</td>
                      <td className="max-w-40 truncate px-2.5 py-2">
                        {t.notes || "—"}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        {TX[t.type]?.side === "Debit" ? money(t.amount) : "—"}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        {TX[t.type]?.side === "Credit" ? money(t.amount) : "—"}
                      </td>
                      <td className="no-print px-2.5 py-2">
                        <button className={btn} onClick={() => setDetail(t)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={fixedType ? 9 : 10}>
                        <Empty>No records match your filters.</Empty>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 bg-slate-100 font-semibold">
                  <tr>
                    <td className="px-2.5 py-2" colSpan={fixedType ? 6 : 7}>
                      Total ({rows.length} records)
                    </td>
                    <td className="px-2.5 py-2 text-right">{money(debit)}</td>
                    <td className="px-2.5 py-2 text-right">{money(credit)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Panel>
      </section>
      {(fixedType === "purchase" || fixedType === "sale") && (
        <TransactionReportPrint
          type={fixedType}
          rows={rows}
          from={from}
          to={to}
          search={q}
        />
      )}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-14"
          onMouseDown={() => setDetail(null)}
        >
          <div
            className="w-full max-w-2xl border border-slate-400 bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-gradient-to-b from-[#24508a] to-[#1a3d6b] px-3 py-2 text-sm font-semibold text-white">
              {detail.voucherNo} · {TX[detail.type]?.label}
              <div className="ml-auto flex items-center gap-2">
                {["purchase", "debit"].includes(detail.type) && (
                  <PrintSizeControl
                    target="bill"
                    label="Print Bill"
                    usePrinterDefault
                  />
                )}
                <button className="no-print" onClick={() => setDetail(null)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 text-xs">
              <div>
                Date: <b>{formatDate(detail.date)}</b>
              </div>
              <div>
                Party: <b>{detail.partyName}</b>
              </div>
              <div>
                Account: <b>{detail.accountName}</b>
              </div>
              <div>
                Payment: <b>{detail.paymentMode || "—"}</b>
              </div>
              <div>
                Amount: <b>{money(detail.amount)}</b>
              </div>
              <div>
                Stock: <b>{TX[detail.type]?.stock}</b>
              </div>
              <div className="col-span-2">Notes: {detail.notes || "—"}</div>
            </div>
            {detail.items?.length > 0 && (
              <div className="px-4 pb-4">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      {["Item", "Unit", "Qty", "Rate", "Amount"].map((x) => (
                        <th key={x} className="border p-2 text-left">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it, i) => (
                      <tr key={i}>
                        {[
                          it.name,
                          it.unit,
                          formatQty(it.qty),
                          money(it.rate),
                          money(it.amount),
                        ].map((v, j) => (
                          <td key={j} className="border p-2">
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {detail && <BillPrint transaction={detail} />}
    </div>
  );
}

export function PartyMasterPage({ type = "customer" }) {
  const partyType = type;
  const path = `/parties?type=${partyType}`;
  const { data, error, setError, loading, refresh } = useLoad(path);
  const [q, setQ] = useState(""),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false);
  const rows = (data ?? []).filter((p) =>
    `${p.name} ${p.phone}`.toLowerCase().includes(q.toLowerCase()),
  );
  const title =
    partyType === "customer" ? "Customer Management" : "Supplier Management";
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const body = {
        name: form.name,
        phone: form.phone,
        openingBalance: Number(form.openingBalance) || 0,
      };
      if (form.id) await api.put(`/parties/${form.id}`, body);
      else await api.post("/parties", { ...body, type: partyType });
      setForm(null);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (p) => {
    if (
      !confirm(
        `Delete ${p.name}? Parties with transaction history cannot be deleted.`,
      )
    )
      return;
    try {
      await api.delete(`/parties/${p.id}`);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div>
      <Header
        title={title}
        subtitle="Manage party names, phone numbers and opening balances."
        actions={
          <button
            className={primary}
            onClick={() => {
              setError("");
              setForm({ name: "", phone: "", openingBalance: "0" });
            }}
          >
            <Plus size={13} /> Add {partyType}
          </button>
        }
      />
      <ErrorBox>{error}</ErrorBox>
      <div className={`${panel} mb-2 flex items-center gap-2 p-3`}>
        <Search size={14} className="text-slate-400" />
        <input
          className={`${input} border-0 focus:ring-0`}
          placeholder="Search name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Panel
        title={`${partyType === "customer" ? "Customers" : "Suppliers"} · ${rows.length} record(s)`}
      >
        {loading ? (
          <Empty>Loading…</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead className="bg-slate-100 text-left text-[11px] uppercase text-slate-600">
                <tr>
                  {[
                    "Name",
                    "Phone",
                    "Opening Balance",
                    "Created",
                    "Actions",
                  ].map((x) => (
                    <th key={x} className="border-b px-3 py-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`border-b hover:bg-blue-50/50 ${i % 2 ? "bg-slate-50/50" : ""}`}
                  >
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{p.phone || "—"}</td>
                    <td className="px-3 py-2">{money(p.openingBalance)}</td>
                    <td className="px-3 py-2">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          className={btn}
                          onClick={() =>
                            setForm({
                              id: p.id,
                              name: p.name,
                              phone: p.phone || "",
                              openingBalance: String(p.openingBalance ?? 0),
                            })
                          }
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className={`${btn} text-rose-700`}
                          onClick={() => remove(p)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={5}>
                      <Empty>No parties found.</Empty>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {form && (
        <Modal
          title={`${form.id ? "Edit" : "Add"} ${partyType}`}
          onClose={() => setForm(null)}
        >
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <label>
              <span className={label}>Name *</span>
              <input
                className={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              <span className={label}>Phone</span>
              <input
                className={input}
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              <span className={label}>Opening Balance (₹)</span>
              <input
                className={input}
                type="number"
                min="0"
                step="0.01"
                value={form.openingBalance}
                onChange={(e) =>
                  setForm({ ...form, openingBalance: e.target.value })
                }
              />
            </label>
          </div>
          <ModalActions
            busy={busy}
            onCancel={() => setForm(null)}
            onSave={save}
            disabled={!form.name.trim()}
          />
        </Modal>
      )}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 p-4 pt-14"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl border border-slate-400 bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between bg-gradient-to-b from-[#24508a] to-[#1a3d6b] px-3 py-2 text-sm font-semibold text-white">
          {title}
          <button onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({ busy, onCancel, onSave, disabled }) {
  return (
    <div className="flex justify-end gap-2 border-t bg-slate-50 p-3">
      <button className={btn} onClick={onCancel}>
        Cancel
      </button>
      <button className={primary} disabled={busy || disabled} onClick={onSave}>
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function ItemsMasterPage() {
  const { data: items, error, setError, loading, refresh } = useLoad("/items");
  const { data: units } = useLoad("/units");
  const [q, setQ] = useState(""),
    [form, setForm] = useState(null),
    [busy, setBusy] = useState(false);
  const rows = (items ?? []).filter((i) =>
    `${i.code ?? ""} ${i.name} ${i.unit}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const save = async () => {
    setBusy(true);
    setError("");
    const body = {
      ...form,
      purchaseRate: Number(form.purchaseRate) || 0,
      saleRate: Number(form.saleRate) || 0,
      minStock: Number(form.minStock) || 0,
      openingStock: Number(form.openingStock) || 0,
    };
    try {
      if (form.id) await api.put(`/items/${form.id}`, body);
      else await api.post("/items", body);
      setForm(null);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (i) => {
    if (!confirm(`Delete ${i.name}?`)) return;
    try {
      await api.delete(`/items/${i.id}`);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div>
      <Header
        title="Item Management"
        subtitle="Stock = opening stock + purchases − debit entries. Payments never change stock."
        actions={
          <button
            className={primary}
            onClick={() => {
              setError("");
              setForm({
                code: "",
                name: "",
                unit: units?.[0]?.name ?? "",
                purchaseRate: "0",
                saleRate: "0",
                openingStock: "0",
                minStock: "0",
              });
            }}
          >
            <Plus size={13} /> Add Item
          </button>
        }
      />
      <ErrorBox>{error}</ErrorBox>
      <div className={`${panel} mb-2 flex items-center gap-2 p-3`}>
        <Search size={14} className="text-slate-400" />
        <input
          className={`${input} border-0 focus:ring-0`}
          placeholder="Item code or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Panel title={`Items · ${rows.length} record(s)`}>
        {loading ? (
          <Empty>Loading…</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-[12px]">
              <thead className="bg-slate-100 text-left text-[10px] uppercase">
                <tr>
                  {[
                    "Code",
                    "Item Name",
                    "Unit",
                    "Purchase Rate",
                    "Sale Rate",
                    "Opening",
                    "Current Stock",
                    "Min. Stock",
                    "Status",
                    "Actions",
                  ].map((x) => (
                    <th key={x} className="border-b px-2.5 py-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((i, n) => {
                  const low = Number(i.stock) < Number(i.minStock ?? 0);
                  return (
                    <tr
                      key={i.id}
                      className={`border-b hover:bg-blue-50/50 ${n % 2 ? "bg-slate-50/50" : ""}`}
                    >
                      <td className="px-2.5 py-2">{i.code || "—"}</td>
                      <td className="px-2.5 py-2 font-medium">{i.name}</td>
                      <td className="px-2.5 py-2">{i.unit}</td>
                      <td className="px-2.5 py-2 text-right">
                        {money(i.purchaseRate || i.price)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        {money(i.saleRate)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        {formatQty(i.openingStock)}
                      </td>
                      <td className="px-2.5 py-2 text-right font-semibold">
                        {formatQty(i.stock)}
                      </td>
                      <td className="px-2.5 py-2 text-right">
                        {formatQty(i.minStock)}
                      </td>
                      <td className="px-2.5 py-2">
                        {Number(i.stock) <= 0
                          ? "Out of stock"
                          : low
                            ? "Low stock"
                            : "OK"}
                      </td>
                      <td className="px-2.5 py-2">
                        <div className="flex gap-1">
                          <button
                            className={btn}
                            onClick={() =>
                              setForm({
                                id: i.id,
                                code: i.code || "",
                                name: i.name,
                                unit: i.unit,
                                purchaseRate: String(
                                  i.purchaseRate || i.price || 0,
                                ),
                                saleRate: String(i.saleRate ?? 0),
                                openingStock: String(i.openingStock ?? 0),
                                minStock: String(i.minStock ?? 0),
                              })
                            }
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            className={`${btn} text-rose-700`}
                            onClick={() => remove(i)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={10}>
                      <Empty>No items found.</Empty>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {form && (
        <Modal
          title={`${form.id ? "Edit" : "Add"} Item`}
          onClose={() => setForm(null)}
        >
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {[
              ["Item Code", "code"],
              ["Item Name *", "name"],
              ["Purchase Rate (₹)", "purchaseRate"],
              ["Sale Rate (₹)", "saleRate"],
              ["Opening Stock", "openingStock"],
              ["Minimum Stock Alert", "minStock"],
            ].map(([t, k]) => (
              <label key={k}>
                <span className={label}>{t}</span>
                <input
                  className={input}
                  type={
                    [
                      "purchaseRate",
                      "saleRate",
                      "openingStock",
                      "minStock",
                    ].includes(k)
                      ? "number"
                      : "text"
                  }
                  min="0"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
            <label>
              <span className={label}>Unit *</span>
              <select
                className={input}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="">Select unit</option>
                {(units ?? []).map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name} ({u.shortName})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ModalActions
            busy={busy}
            onCancel={() => setForm(null)}
            onSave={save}
            disabled={!form.name.trim() || !form.unit}
          />
        </Modal>
      )}
    </div>
  );
}

export function UnitsMasterPage() {
  const { data: units, error, setError, loading, refresh } = useLoad("/units");
  const [form, setForm] = useState(null),
    [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      if (form.id) await api.put(`/units/${form.id}`, form);
      else await api.post("/units", form);
      setForm(null);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const remove = async (u) => {
    if (!confirm(`Delete unit ${u.name}?`)) return;
    try {
      await api.delete(`/units/${u.id}`);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div>
      <Header
        title="Units Management"
        subtitle="Manage units of measurement used by items."
        actions={
          <button
            className={primary}
            onClick={() => setForm({ name: "", shortName: "" })}
          >
            <Plus size={13} /> Add Unit
          </button>
        }
      />
      <ErrorBox>{error}</ErrorBox>
      <Panel title={`Units · ${(units ?? []).length} record(s)`}>
        {loading ? (
          <Empty>Loading…</Empty>
        ) : (
          <table className="w-full max-w-3xl text-[13px]">
            <thead className="bg-slate-100 text-left text-[11px] uppercase">
              <tr>
                <th className="border-b px-3 py-2">Unit Name</th>
                <th className="border-b px-3 py-2">Short Name</th>
                <th className="border-b px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(units ?? []).map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b ${i % 2 ? "bg-slate-50/50" : ""}`}
                >
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2">{u.shortName}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button className={btn} onClick={() => setForm({ ...u })}>
                        <Pencil size={12} />
                      </button>
                      <button
                        className={`${btn} text-rose-700`}
                        onClick={() => remove(u)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!units?.length && (
                <tr>
                  <td colSpan={3}>
                    <Empty>
                      No units found. Add a unit to use it in the item master.
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Panel>
      {form && (
        <Modal
          title={`${form.id ? "Edit" : "Add"} Unit`}
          onClose={() => setForm(null)}
        >
          <div className="grid gap-3 p-4">
            <label>
              <span className={label}>Unit Name *</span>
              <input
                className={input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Kilogram"
              />
            </label>
            <label>
              <span className={label}>Short Name *</span>
              <input
                className={input}
                value={form.shortName}
                onChange={(e) =>
                  setForm({ ...form, shortName: e.target.value })
                }
                placeholder="Kg"
              />
            </label>
          </div>
          <ModalActions
            busy={busy}
            onCancel={() => setForm(null)}
            onSave={save}
            disabled={!form.name.trim() || !form.shortName.trim()}
          />
        </Modal>
      )}
    </div>
  );
}

export function BusinessReportPage() {
  const { data: tx, error, loading } = useLoad("/transactions?limit=500");
  const { data: items } = useLoad("/items");
  const { data: summary } = useLoad("/summary");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  const rows = (tx ?? []).filter(
    (t) => (!from || t.date >= from) && (!to || t.date <= to),
  );
  const sums = Object.fromEntries(
    Object.keys(TX).map((k) => [
      k,
      rows.filter((t) => t.type === k).reduce((s, t) => s + t.amount, 0),
    ]),
  );
  const counts = Object.fromEntries(
    Object.keys(TX).map((k) => [k, rows.filter((t) => t.type === k).length]),
  );
  const stockValue = (items ?? []).reduce(
    (s, i) =>
      s + (Number(i.stock) || 0) * Number(i.purchaseRate || i.price || 0),
    0,
  );
  return (
    <div className="print-target-page">
      <Header
        title="Business Summary"
        subtitle="Voucher totals for the selected period and current business position."
        actions={<PrintSizeControl target="page" />}
      />
      <ErrorBox>{error}</ErrorBox>
      <div
        className={`${panel} no-print mb-3 flex flex-wrap items-end gap-2 p-3`}
      >
        <label>
          <span className={label}>From</span>
          <input
            className={`${input} w-40`}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          <span className={label}>To</span>
          <input
            className={`${input} w-40`}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className={btn}
          onClick={() => {
            setFrom("");
            setTo("");
          }}
        >
          Reset
        </button>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Transaction Summary">
          <table className="w-full text-[12px]">
            <thead className="bg-slate-100 text-left">
              <tr>
                {[
                  "Transaction",
                  "Ledger Effect",
                  "Stock",
                  "Vouchers",
                  "Amount",
                ].map((x) => (
                  <th key={x} className="border-b px-2 py-2">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(TX).map(([k, v]) => (
                <tr key={k} className="border-b">
                  <td className="px-2 py-2 font-medium">{v.label}</td>
                  <td className="px-2 py-2">
                    {v.party} {v.side}
                  </td>
                  <td className="px-2 py-2">{v.stock}</td>
                  <td className="px-2 py-2 text-right">{counts[k] ?? 0}</td>
                  <td className="px-2 py-2 text-right">
                    {money(sums[k] ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Panel title="Current Position">
          <table className="w-full text-[13px]">
            <tbody>
              {[
                [
                  "Pending Receivables (Customers)",
                  money(summary?.pendingReceivables),
                ],
                [
                  "Pending Payables (Suppliers)",
                  money(summary?.pendingPayables),
                ],
                ["Inventory Value (at purchase rate)", money(stockValue)],
                ["Items in Master", (items ?? []).length],
                ["Transactions in Period", loading ? "…" : rows.length],
              ].map(([k, v]) => (
                <tr key={k} className="border-b">
                  <td className="px-3 py-2 text-slate-600">{k}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}

export function StockReportPage() {
  const { data, error, loading } = useLoad("/items");
  const [q, setQ] = useState(""),
    [low, setLow] = useState(false);
  const rows = (data ?? []).filter(
    (i) =>
      (!q ||
        `${i.code ?? ""} ${i.name}`.toLowerCase().includes(q.toLowerCase())) &&
      (!low || Number(i.stock) < Number(i.minStock ?? 0)),
  );
  const total = rows.reduce(
    (s, i) => s + Number(i.stock || 0) * Number(i.purchaseRate || i.price || 0),
    0,
  );
  const exportRows = [
    [
      "Code",
      "Item",
      "Unit",
      "Opening",
      "Closing Stock",
      "Purchase Rate",
      "Stock Value",
    ],
    ...rows.map((i) => [
      i.code,
      i.name,
      i.unit,
      i.openingStock,
      i.stock,
      i.purchaseRate || i.price,
      Number(i.stock || 0) * Number(i.purchaseRate || i.price || 0),
    ]),
    ["", "", "", "", "", "TOTAL", total],
  ];
  return (
    <div className="print-target-page">
      <Header
        title="Stock Report"
        subtitle="Closing stock = opening stock + purchases − debit entries. Valued at purchase rate."
        actions={
          <ExportActions
            rows={exportRows}
            name="stock-report.csv"
            target="page"
          />
        }
      />
      <ErrorBox>{error}</ErrorBox>
      <div
        className={`${panel} no-print mb-2 flex flex-wrap items-center gap-3 p-3`}
      >
        <div className="relative min-w-48 flex-1">
          <Search size={13} className="absolute left-2 top-2 text-slate-400" />
          <input
            className={`${input} pl-7`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search item code or name…"
          />
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />{" "}
          Low stock only
        </label>
      </div>
      <Panel title={`Stock Report · ${rows.length} item(s)`}>
        {loading ? (
          <Empty>Loading…</Empty>
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[850px] text-[12px]">
              <thead className="bg-slate-100 text-left text-[10px] uppercase">
                <tr>
                  {[
                    "Code",
                    "Item",
                    "Unit",
                    "Opening",
                    "Closing Stock",
                    "Purchase Rate",
                    "Stock Value",
                    "Status",
                  ].map((x) => (
                    <th key={x} className="border-b px-2.5 py-2">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-b">
                    <td className="px-2.5 py-2">{i.code || "—"}</td>
                    <td className="px-2.5 py-2 font-medium">{i.name}</td>
                    <td className="px-2.5 py-2">{i.unit}</td>
                    <td className="px-2.5 py-2 text-right">
                      {formatQty(i.openingStock)}
                    </td>
                    <td className="px-2.5 py-2 text-right font-semibold">
                      {formatQty(i.stock)}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      {money(i.purchaseRate || i.price)}
                    </td>
                    <td className="px-2.5 py-2 text-right">
                      {money(
                        Number(i.stock || 0) *
                          Number(i.purchaseRate || i.price || 0),
                      )}
                    </td>
                    <td className="px-2.5 py-2">
                      {Number(i.stock) <= 0
                        ? "Out of stock"
                        : Number(i.stock) < Number(i.minStock ?? 0)
                          ? "Low stock"
                          : "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-semibold">
                <tr>
                  <td colSpan={6} className="px-2.5 py-2 text-right">
                    Total Stock Value
                  </td>
                  <td className="px-2.5 py-2 text-right">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            {!rows.length && <Empty>No stock rows match your filters.</Empty>}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function OutstandingReportPage() {
  const { data: customers, error: e1 } = useLoad("/ledger/customers");
  const { data: suppliers, error: e2 } = useLoad("/ledger/suppliers");
  const navigate = useNavigate();
  const block = (title, kind, data) => {
    const expectedSide = kind === "customers" ? "Dr" : "Cr";
    const rows = (data?.rows ?? []).filter(
      (r) =>
        Number(r.closing?.amount ?? 0) > 0 &&
        r.closing?.sideCode === expectedSide,
    );
    const total = rows.reduce((s, r) => s + Number(r.closing.amount), 0);
    return (
      <Panel title={title}>
        <table className="w-full text-[12px]">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="border-b px-3 py-2">Name</th>
              <th className="border-b px-3 py-2">Phone</th>
              <th className="border-b px-3 py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer border-b hover:bg-blue-50"
                onClick={() =>
                  navigate(
                    `${kind === "customers" ? "/ledger/customer" : "/ledger/owner"}/${r.id}`,
                  )
                }
              >
                <td className="px-3 py-2 font-medium text-[#1f4e8c]">
                  {r.name}
                </td>
                <td className="px-3 py-2">{r.phone || "—"}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {money(r.closing.amount)} {r.closing.sideCode}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-semibold">
            <tr>
              <td colSpan={2} className="px-3 py-2">
                Total ({rows.length})
              </td>
              <td className="px-3 py-2 text-right">{money(total)}</td>
            </tr>
          </tfoot>
        </table>
      </Panel>
    );
  };
  return (
    <div className="print-target-page">
      <Header
        title="Outstanding Report"
        subtitle="Pending receivables from customers and payables to suppliers."
        actions={<PrintSizeControl target="page" />}
      />
      <ErrorBox>{e1 || e2}</ErrorBox>
      <div className="grid gap-3 lg:grid-cols-2">
        {block("Receivables – Customers (Dr)", "customers", customers)}
        {block("Payables – Suppliers (Cr)", "suppliers", suppliers)}
      </div>
    </div>
  );
}

export function LedgerReportPage() {
  const { data: customers, error: e1 } = useLoad("/ledger/customers");
  const { data: suppliers, error: e2 } = useLoad("/ledger/suppliers");
  const sections = [
    { title: "Customer Ledger Summary", data: customers },
    { title: "Owner's Ledger Summary", data: suppliers },
  ];
  return (
    <div className="print-target-page">
      <Header
        title="Ledger Report"
        subtitle="Consolidated customer and supplier ledger balances."
        actions={<PrintSizeControl target="page" />}
      />
      <ErrorBox>{e1 || e2}</ErrorBox>
      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((s) => (
          <Panel key={s.title} title={s.title}>
            <table className="w-full text-[12px]">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="border-b px-3 py-2">Party</th>
                  <th className="border-b px-3 py-2 text-right">Debit</th>
                  <th className="border-b px-3 py-2 text-right">Credit</th>
                  <th className="border-b px-3 py-2 text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {(s.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 text-right">
                      {money(r.totalDebit)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {money(r.totalCredit)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {money(r.closing.amount)} {r.closing.sideCode}
                    </td>
                  </tr>
                ))}
                {!s.data?.rows?.length && (
                  <tr>
                    <td colSpan={4}>
                      <Empty>No parties found.</Empty>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-100 font-semibold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2 text-right">
                    {money(s.data?.totals?.debit)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(s.data?.totals?.credit)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(s.data?.totals?.outstanding)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Panel>
        ))}
      </div>
    </div>
  );
}
