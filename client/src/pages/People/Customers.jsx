import { useEffect, useMemo, useState } from "react";
import { FaEdit, FaPhoneAlt, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";

import salesService from "../../services/salesService";

const EMPTY_FORM = {
  customer_name: "",
  phone1: "",
  email: "",
  address: "",
  previous_due_amount: "",
};

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.customer_name, customer.phone1, customer.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, search]);

  const resetFormState = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const fetchCustomers = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await salesService.searchCustomers(searchValue.trim());
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to load customers.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchCustomers(search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        customer_name: form.customer_name.trim(),
        phone1: form.phone1.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        previous_due_amount:
          form.previous_due_amount === "" ? "0.00" : form.previous_due_amount,
      };

      if (editingId) {
        await salesService.updateCustomer(editingId, payload);
        toast.success("Customer updated successfully.");
      } else {
        await salesService.createCustomer(payload);
        toast.success("Customer added successfully.");
      }

      resetFormState();
      setShowForm(false);
      await fetchCustomers(search);
    } catch (err) {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === "object"
          ? Object.entries(data)
              .map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`)
              .join(" ")
          : err.message) ||
        "Failed to save customer.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setShowForm(true);
    setError("");
    setForm({
      customer_name: customer.customer_name || "",
      phone1: customer.phone1 || "",
      email: customer.email || "",
      address: customer.address || "",
      previous_due_amount: customer.previous_due_amount || "",
    });
  };

  const openDeleteConfirmation = (customer) => {
    setCustomerToDelete(customer);
    setError("");
  };

  const closeDeleteConfirmation = () => {
    if (deleting) return;
    setCustomerToDelete(null);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      setDeleting(true);
      setError("");
      await salesService.deleteCustomer(customerToDelete.id);
      setCustomers((current) =>
        current.filter((item) => item.id !== customerToDelete.id)
      );
      toast.success("Customer deleted successfully.");
      if (editingId === customerToDelete.id) {
        resetFormState();
      }
      setCustomerToDelete(null);
    } catch (err) {
      const detail =
        err.response?.data?.detail || err.message || "Failed to delete customer.";
      setError(detail);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Customer Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create, review, and maintain customer records from one workspace.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone, or email"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!showForm) resetFormState();
                setShowForm((current) => !current);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <FaPlus className="text-xs" />
              {showForm ? "Close Form" : "Add Customer"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className={`mt-5 flex flex-col gap-5 ${showForm ? "xl:flex-row" : ""}`}>
          <section className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Customer List</h2>
              <span className="text-xs text-slate-500">
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                No customers found. Add your first customer from the form.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium">Address</th>
                        <th className="px-4 py-3 text-right font-medium">Previous Due</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="align-top">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">
                              {customer.customer_name}
                            </div>
                            {customer.email && (
                              <div className="mt-1 text-xs text-slate-500">
                                {customer.email}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-2 text-slate-700">
                              <FaPhoneAlt className="text-xs text-slate-400" />
                              <span>{customer.phone1}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {customer.address || <span className="text-slate-400">Not provided</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(customer.previous_due_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(customer)}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                              >
                                <FaEdit className="text-xs" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteConfirmation(customer)}
                                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                              >
                                <FaTrash className="text-xs" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {showForm && (
            <aside className="xl:w-[360px] xl:border-l xl:border-slate-200 xl:pl-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {editingId ? "Edit Customer" : "Add Customer"}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Capture clean contact details for sales and follow-up.
                    </p>
                  </div>
                  {editingId && (
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                      ID: {editingId}
                    </span>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Customer Name
                    </label>
                    <input
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Phone Number
                    </label>
                    <input
                      name="phone1"
                      value={form.phone1}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Previous Due
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="previous_due_amount"
                      value={form.previous_due_amount}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      rows={4}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetFormState}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="min-w-[150px] rounded-full border border-emerald-700 bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:border-emerald-500 disabled:bg-emerald-500 disabled:text-white"
                    >
                      {saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update Customer" : "Save Customer"}
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          )}
        </div>
      </div>

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <FaTrash className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete customer?
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will permanently remove{" "}
                  <span className="font-semibold text-slate-800">
                    {customerToDelete.customer_name}
                  </span>
                  {" "}from your customer records.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Customer Summary
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div>
                  <span className="font-medium text-slate-800">Phone:</span>{" "}
                  {customerToDelete.phone1 || "Not provided"}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Email:</span>{" "}
                  {customerToDelete.email || "Not provided"}
                </div>
                <div>
                  <span className="font-medium text-slate-800">Previous Due:</span>{" "}
                  {formatCurrency(customerToDelete.previous_due_amount)}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirmation}
                disabled={deleting}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {deleting ? "Deleting..." : "Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
