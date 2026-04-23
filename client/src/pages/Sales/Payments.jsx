import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaHistory, FaReceipt, FaSearch, FaTimes, FaWallet } from "react-icons/fa";
import toast from "react-hot-toast";

import salesService from "../../services/salesService";

const fmt = (v) =>
  `৳ ${Number(v || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMethod = (v) =>
  v ? v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Cash";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_CONFIG = {
  paid: { label: "Paid", classes: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  partial: { label: "Partial", classes: "bg-amber-50 text-amber-700 ring-amber-200" },
  unpaid: { label: "Unpaid", classes: "bg-red-50 text-red-700 ring-red-200" },
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const initPayForm = (due = "") => ({
  amount: due,
  payment_method: "cash",
  reference_number: "",
  mobile_provider: "",
  note: "",
});

export default function SalesPayments() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [expandedId, setExpandedId] = useState(null);

  const [collectModal, setCollectModal] = useState(null);
  const [payForm, setPayForm] = useState(initPayForm());
  const [saving, setSaving] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (methodFilter) params.payment_method = methodFilter;
      if (statusFilter) params.payment_status = statusFilter;
      const data = await salesService.getPayments(params);
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo, methodFilter, statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const totals = useMemo(
    () =>
      sales.reduce(
        (acc, s) => ({
          total: acc.total + Number(s.grand_total || 0),
          paid: acc.paid + Number(s.paid_amount || 0),
          due: acc.due + Number(s.due_amount || 0),
        }),
        { total: 0, paid: 0, due: 0 },
      ),
    [sales],
  );

  function openCollect(sale) {
    setPayForm(initPayForm(Number(sale.due_amount).toFixed(2)));
    setCollectModal({ sale });
  }

  async function handleCollect(e) {
    e.preventDefault();
    const { sale } = collectModal;
    try {
      setSaving(true);
      await salesService.createInvoicePayment(sale.id, payForm);
      toast.success("Payment recorded.");
      setCollectModal(null);
      loadPayments();
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.amount?.[0] ||
        err.message ||
        "Failed to record payment.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const hasFilters = search || dateFrom || dateTo || methodFilter || statusFilter;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-slate-900">Sales Payments</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track, filter, and collect invoice payments across all sales.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-2.5 text-xs text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Invoice, customer, phone…"
                className="w-56 rounded-full border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setMethodFilter(""); setStatusFilter(""); }}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Invoice Total</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{fmt(totals.total)}</div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Collected</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{fmt(totals.paid)}</div>
            </div>
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs uppercase tracking-wide text-red-700">Outstanding Due</div>
              <div className="mt-2 text-2xl font-semibold text-red-900">{fmt(totals.due)}</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">Loading payments…</div>
          ) : sales.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Paid</th>
                    <th className="px-4 py-3 text-right font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {sales.map((sale) => {
                    const due = Number(sale.due_amount || 0);
                    const statusCfg = STATUS_CONFIG[sale.payment_status] || STATUS_CONFIG.unpaid;
                    const isExpanded = expandedId === sale.id;
                    return (
                      <>
                        <tr key={sale.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 font-medium">
                              <FaReceipt className="text-slate-400" />
                              <Link
                                to={`/sales/invoice/${sale.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {sale.sale_no}
                              </Link>
                            </div>
                            <div className="mt-0.5 text-xs text-slate-500">{fmtDate(sale.sale_date)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-slate-700">{sale.customer_name}</div>
                            {sale.contact_number && (
                              <div className="text-xs text-slate-500">{sale.contact_number}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                              {fmtMethod(sale.payment_method)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {fmt(sale.grand_total)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-700">
                            {fmt(sale.paid_amount)}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${due > 0 ? "text-red-700" : "text-slate-500"}`}>
                            {fmt(sale.due_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusCfg.classes}`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {due > 0 && (
                                <button
                                  onClick={() => openCollect(sale)}
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                                >
                                  <FaWallet className="text-[9px]" /> Collect
                                </button>
                              )}
                              {sale.transactions?.length > 0 && (
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition"
                                >
                                  <FaHistory className="text-[9px]" />
                                  {isExpanded ? "Hide" : `Txns (${sale.transactions.length})`}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${sale.id}-history`}>
                            <td colSpan={8} className="bg-slate-50 px-8 py-3">
                              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Payment History
                              </div>
                              <div className="space-y-2">
                                {sale.transactions.map((txn) => (
                                  <div
                                    key={txn.id}
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FaCheck className="text-emerald-500 shrink-0" />
                                      <div>
                                        <div className="font-medium text-slate-700">
                                          {fmtMethod(txn.payment_method)}
                                        </div>
                                        {txn.reference_number && (
                                          <div className="text-slate-500">Ref: {txn.reference_number}</div>
                                        )}
                                        {txn.note && <div className="text-slate-500">{txn.note}</div>}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-emerald-700">{fmt(txn.amount)}</div>
                                      <div className="text-slate-500">{fmtDate(txn.payment_date)}</div>
                                      {txn.received_by_username && (
                                        <div className="text-slate-400">{txn.received_by_username}</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {collectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Collect Payment</h2>
              <button
                onClick={() => setCollectModal(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-700">{collectModal.sale.sale_no}</div>
              <div className="text-slate-500">{collectModal.sale.customer_name}</div>
              <div className="mt-1 font-semibold text-red-600">
                Outstanding Due: {fmt(collectModal.sale.due_amount)}
              </div>
            </div>

            <form onSubmit={handleCollect} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={collectModal.sale.due_amount}
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method *</label>
                <select
                  required
                  value={payForm.payment_method}
                  onChange={(e) => setPayForm((p) => ({ ...p, payment_method: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {payForm.payment_method === "mobile_banking" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mobile Provider</label>
                  <input
                    value={payForm.mobile_provider}
                    onChange={(e) => setPayForm((p) => ({ ...p, mobile_provider: e.target.value }))}
                    placeholder="bKash, Nagad, Rocket…"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}

              {["card", "bank_transfer", "cheque", "mobile_banking"].includes(payForm.payment_method) && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Reference Number</label>
                  <input
                    value={payForm.reference_number}
                    onChange={(e) => setPayForm((p) => ({ ...p, reference_number: e.target.value }))}
                    placeholder="Transaction / Cheque no."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
                <input
                  value={payForm.note}
                  onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Optional note"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 transition"
                >
                  {saving ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
