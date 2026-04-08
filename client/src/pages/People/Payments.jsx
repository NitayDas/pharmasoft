import { useEffect, useMemo, useState } from "react";
import { FaSearch, FaUserCheck, FaUserClock } from "react-icons/fa";

import salesService from "../../services/salesService";

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function PeoplePayments() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await salesService.getCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load customer payment data.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.customer_name, customer.phone1, customer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, search]);

  const totalDue = filteredCustomers.reduce(
    (sum, customer) => sum + Number(customer.previous_due_amount || 0),
    0
  );
  const totalPurchase = filteredCustomers.reduce(
    (sum, customer) => sum + Number(customer.total_purchase_amount || 0),
    0
  );
  const dueCustomers = filteredCustomers.filter(
    (customer) => Number(customer.previous_due_amount || 0) > 0
  ).length;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">People Payments</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review customer balances, purchase totals, and payment status from one place.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, phone, or email"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Customers With Due</div>
              <div className="mt-2 flex items-center gap-3">
                <FaUserClock className="text-amber-500" />
                <span className="text-3xl font-semibold text-slate-900">{dueCustomers}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="text-xs uppercase tracking-wide text-emerald-700">Total Purchase</div>
              <div className="mt-2 flex items-center gap-3">
                <FaUserCheck className="text-emerald-500" />
                <span className="text-2xl font-semibold text-emerald-900">{formatCurrency(totalPurchase)}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
              <div className="text-xs uppercase tracking-wide text-red-700">Total Due</div>
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
            <div className="px-4 py-16 text-center text-sm text-slate-500">Loading payment data...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-slate-500">No customer payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 text-right font-medium">Purchase</th>
                    <th className="px-4 py-3 text-right font-medium">Due</th>
                    <th className="px-4 py-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCustomers.map((customer) => {
                    const due = Number(customer.previous_due_amount || 0);
                    const hasDue = due > 0;
                    return (
                      <tr key={customer.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{customer.customer_name}</div>
                          {customer.address && <div className="mt-1 text-xs text-slate-500">{customer.address}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{customer.phone1 || "Not provided"}</div>
                          <div className="mt-1 text-xs text-slate-500">{customer.email || "No email"}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {formatCurrency(customer.total_purchase_amount)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${hasDue ? "text-red-700" : "text-emerald-700"}`}>
                          {formatCurrency(due)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${hasDue ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"}`}>
                            {hasDue ? "Due Pending" : "Clear"}
                          </span>
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
    </div>
  );
}
