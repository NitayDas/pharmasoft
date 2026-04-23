import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FaCheck, FaReceipt, FaSearch, FaTimes, FaUserClock, FaWallet } from "react-icons/fa";
import toast from "react-hot-toast";

import salesService from "../../services/salesService";

const fmt = (v) =>
  `৳ ${Number(v || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtMethod = (v) =>
  v ? v.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Cash";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const STATUS_BADGE = {
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  partial: "bg-amber-50 text-amber-700 ring-amber-200",
  unpaid: "bg-red-50 text-red-700 ring-red-200",
};

const initPayForm = (due = "") => ({
  amount: due,
  payment_method: "cash",
  reference_number: "",
  mobile_provider: "",
  note: "",
});

export default function PeoplePayments() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Ledger panel
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Collect payment modal (from ledger)
  const [collectModal, setCollectModal] = useState(null);
  const [payForm, setPayForm] = useState(initPayForm());
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await salesService.searchCustomers(search);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  async function openLedger(customer) {
    setLedger({ customer, invoices: [], summary: null });
    setLedgerLoading(true);
    try {
      const data = await salesService.getCustomerLedger(customer.id);
      setLedger(data);
    } catch (err) {
      toast.error("Failed to load ledger.");
      setLedger(null);
    } finally {
      setLedgerLoading(false);
    }
  }

  function openCollect(invoice) {
    setPayForm(initPayForm(Number(invoice.due_amount).toFixed(2)));
    setCollectModal({ invoice });
  }

  async function handleCollect(e) {
    e.preventDefault();
    const { invoice } = collectModal;
    try {
      setSaving(true);
      await salesService.createInvoicePayment(invoice.id, payForm);
      toast.success("Payment recorded.");
      setCollectModal(null);
      // Refresh ledger
      if (ledger?.customer) {
        const data = await salesService.getCustomerLedger(ledger.customer.id);
        setLedger(data);
      }
      loadCustomers();
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

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email].filter(Boolean).some((v) => v.toLowerCase().includes(q)),
    );
  }, [customers, search]);

  const totals = useMemo(
    () =>
      filteredCustomers.reduce(
        (acc, c) => ({
          purchase: acc.purchase + Number(c.total_purchase_amount || 0),
          due: acc.due + Number(c.total_due_amount || 0),
        }),
        { purchase: 0, due: 0 },
      ),
    [filteredCustomers],
  );

  const dueCount = filteredCustomers.filter((c) => Number(c.total_due_amount || 0) > 0).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Customer Receivables</h1>
              <p className="mt-1 text-sm text-slate-500">
                View balances, ledgers, and collect outstanding dues from customers.
              </p>
            </div>
            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-2.5 text-xs text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, email…"
                className="w-full rounded-full border border-slate-200 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Customers With Due</div>
              <div className="mt-2 flex items-center gap-3">
                <FaUserClock className="text-amber-500" />
                <span className="text-3xl font-semibold text-slate-900">{dueCount}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Total Purchase</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{fmt(totals.purchase)}</div>
            </div>
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs uppercase tracking-wide text-red-700">Total Outstanding Due</div>
              <div className="mt-2 text-2xl font-semibold text-red-900">{fmt(totals.due)}</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">Loading customers…</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">No customer records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 text-right font-medium">Total Purchase</th>
                    <th className="px-4 py-3 text-right font-medium">Outstanding Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCustomers.map((c) => {
                    const due = Number(c.total_due_amount || 0);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{c.name}</div>
                          {c.address && <div className="mt-0.5 text-xs text-slate-500">{c.address}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700">{c.phone || "—"}</div>
                          {c.email && <div className="text-xs text-slate-500">{c.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {fmt(c.total_purchase_amount)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${due > 0 ? "text-red-700" : "text-slate-500"}`}>
                          {fmt(due)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${due > 0 ? "bg-red-50 text-red-700 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}>
                            {due > 0 ? "Due Pending" : "Clear"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openLedger(c)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition"
                          >
                            <FaReceipt className="text-[9px]" /> View Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Customer Ledger Side Panel */}
      {ledger !== null && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={() => { if (!collectModal) setLedger(null); }}
          />
          <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {ledger.customer?.name || "Customer Ledger"}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{ledger.customer?.phone}</p>
              </div>
              <button
                onClick={() => setLedger(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <FaTimes />
              </button>
            </div>

            {ledgerLoading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
                Loading ledger…
              </div>
            ) : (
              <>
                {ledger.summary && (
                  <div className="grid grid-cols-3 gap-3 border-b border-slate-100 p-5">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                      <div className="text-xs text-slate-400">Total Purchase</div>
                      <div className="mt-1 font-semibold text-slate-800">{fmt(ledger.summary.total_purchase)}</div>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                      <div className="text-xs text-emerald-600">Total Paid</div>
                      <div className="mt-1 font-semibold text-emerald-800">{fmt(ledger.summary.total_paid)}</div>
                    </div>
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center">
                      <div className="text-xs text-red-600">Outstanding Due</div>
                      <div className="mt-1 font-semibold text-red-800">{fmt(ledger.summary.total_due)}</div>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {(!ledger.invoices || ledger.invoices.length === 0) ? (
                    <div className="py-10 text-center text-sm text-slate-500">No invoices found.</div>
                  ) : (
                    ledger.invoices.map((inv) => {
                      const invDue = Number(inv.due_amount || 0);
                      const statusKey = inv.payment_status || "unpaid";
                      return (
                        <div
                          key={inv.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/sales/invoice/${inv.id}`}
                                  className="font-semibold text-blue-600 hover:underline text-sm"
                                >
                                  {inv.sale_no}
                                </Link>
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_BADGE[statusKey] || STATUS_BADGE.unpaid}`}>
                                  {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">{fmtDate(inv.sale_date)}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-sm font-semibold text-slate-800">{fmt(inv.grand_total)}</div>
                              <div className="text-xs text-emerald-600">Paid: {fmt(inv.paid_amount)}</div>
                              {invDue > 0 && (
                                <div className="text-xs text-red-600">Due: {fmt(invDue)}</div>
                              )}
                            </div>
                          </div>

                          {inv.transactions?.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {inv.transactions.map((txn) => (
                                <div
                                  key={txn.id}
                                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <FaCheck className="text-emerald-500 shrink-0" />
                                    <span className="text-slate-600">{fmtMethod(txn.payment_method)}</span>
                                    {txn.reference_number && (
                                      <span className="text-slate-400">({txn.reference_number})</span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="font-medium text-emerald-700">{fmt(txn.amount)}</span>
                                    <span className="ml-2 text-slate-400">{fmtDate(txn.payment_date)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {invDue > 0 && (
                            <button
                              onClick={() => openCollect(inv)}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                            >
                              <FaWallet className="text-[9px]" /> Collect Due
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
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
              <div className="font-medium text-slate-700">{collectModal.invoice.sale_no}</div>
              <div className="mt-1 font-semibold text-red-600">
                Outstanding Due: {fmt(collectModal.invoice.due_amount)}
              </div>
            </div>

            <form onSubmit={handleCollect} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={collectModal.invoice.due_amount}
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
