import { useEffect, useMemo, useState } from "react";
import { FaReceipt, FaSearch } from "react-icons/fa";

import salesService from "../../services/salesService";

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatMethod = (value) =>
  value ? value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Cash";

export default function SalesPayments() {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await salesService.getInvoices();
        setSales(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load sales payments.");
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter((sale) =>
      [sale.sale_no, sale.customer_name, sale.served_by_username, sale.payment_method]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [sales, search]);

  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + Number(sale.grand_total || 0), 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0);
  const totalDue = filteredSales.reduce((sum, sale) => sum + Number(sale.due_amount || 0), 0);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Sales Payments</h1>
              <p className="mt-1 text-sm text-slate-500">
                Track invoice payment methods, collected amounts, and due positions across sales.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoice, customer, cashier, or method"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Invoice Total</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalSalesAmount)}</div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Collected</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-900">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs uppercase tracking-wide text-red-700">Outstanding Due</div>
              <div className="mt-2 text-2xl font-semibold text-red-900">{formatCurrency(totalDue)}</div>
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
            <div className="px-4 py-16 text-center text-sm text-slate-500">Loading invoice payments...</div>
          ) : filteredSales.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">No sales payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 text-right font-medium">Grand Total</th>
                    <th className="px-4 py-3 text-right font-medium">Paid</th>
                    <th className="px-4 py-3 text-right font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2 font-medium text-slate-900">
                          <FaReceipt className="text-slate-400" />
                          {sale.sale_no}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{sale.sale_date}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{sale.customer_name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                          {formatMethod(sale.payment_method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(sale.grand_total)}</td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-700">{formatCurrency(sale.paid_amount)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${Number(sale.due_amount || 0) > 0 ? "text-red-700" : "text-slate-700"}`}>
                        {formatCurrency(sale.due_amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{sale.served_by_username || "System"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
