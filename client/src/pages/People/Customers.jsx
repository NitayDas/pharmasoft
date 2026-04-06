import { useEffect, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaUser,
  FaPhoneAlt,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import AxiosInstance from "../../components/AxiosInstance";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // edit mode
  const [editingId, setEditingId] = useState(null);

  const getEmptyForm = () => ({
    customer_name: "",
    phone1: "",
    address: "",
    previous_due_amount: "",
  });

  const [form, setForm] = useState(() => getEmptyForm());

  const resetFormState = () => {
    setForm(getEmptyForm());
    setEditingId(null);
  };

  // -------- API calls --------
  const fetchCustomers = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");

      if (searchValue.trim()) params.search = searchValue.trim();

      const res = await AxiosInstance.get("customers/");
      const data = res.data;
      const items = Array.isArray(data) ? data : data.results || [];
      setCustomers(items);
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to fetch customers";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);


  // -------- handlers --------
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchCustomers(value);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      previous_due_amount:
        form.previous_due_amount === "" ? null : form.previous_due_amount
    };

    try {
      if (editingId) {
        await AxiosInstance.patch(`customers/${editingId}/`, payload);
      } else {
        await AxiosInstance.post("customers/", payload);
      }

      resetFormState();
      setShowForm(false);
      fetchCustomers(search);
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to save customer";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    setShowForm(true);

    setForm({
      customer_name: customer.customer_name || "",
      phone1: customer.phone1 || "",
      address: customer.address || "",
      previous_due_amount: customer.previous_due_amount || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }
    try {
      await AxiosInstance.delete(`customers/${id}/`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to delete customer";
      setError(detail);
    }
  };

  // -------- render --------

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
              Sales – Customers
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Add and manage your customers in a single view.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative w-full sm:w-64 md:w-72">
              <FaSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by name, phone, shop..."
                className="w-full pl-9 pr-3 py-1.5 rounded-full border border-slate-200 text-xs md:text-sm focus:outline-none focus:ring focus:ring-blue-500/30"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!showForm) resetFormState();
                setShowForm((prev) => !prev);
              }}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs md:text-sm font-medium hover:bg-blue-700 transition"
            >
              <FaPlus className="w-3 h-3" />
              {showForm ? "Close Form" : "Add Customer"}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm px-3 py-2 rounded-xl">
            {error}
          </div>
        )}

        {/* Main content: list + compact side form */}
        <div
          className={`flex flex-col gap-4 ${
            showForm ? "lg:flex-row lg:items-start" : ""
          }`}
        >
          {/* Customer List */}
          <div className={`flex-1 ${showForm ? "lg:pr-2" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">
                Customer List
              </h2>
              <span className="text-[11px] md:text-xs text-slate-500">
                {customers.length} customer{customers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <p className="text-xs md:text-sm text-slate-500">
                Loading customers...
              </p>
            ) : customers.length === 0 ? (
              <p className="text-xs md:text-sm text-slate-500">
                No customers found.
              </p>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[460px] md:max-h-[520px] scrollbar-thin">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] md:text-xs">
                        <th className="px-3 py-2 text-left">Customer</th>
                        <th className="px-3 py-2 text-left">Contact</th>
                        <th className="px-3 py-2 text-right">Prev. Due</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                        return (
                          <tr key={c.id} className="border-t">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-slate-800 text-xs md:text-sm">
                                    {c.customer_name}
                                  </div>
                                  {c.email && (
                                    <div className="text-[10px] text-slate-500">
                                      {c.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                                <FaPhoneAlt className="w-3 h-3" />
                                <span>{c.phone1}</span>
                              </div>
                            </td>
                            
                            <td className="px-3 py-2 text-[11px]">
                              {c.district || c.division ? (
                                <>
                                  {c.district && <span>{c.district}</span>}
                                  {c.district && c.division && ", "}
                                  {c.division && <span>{c.division}</span>}
                                </>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-[11px] md:text-sm">
                              {c.previous_due_amount
                                ? `৳ ${Number(
                                    c.previous_due_amount
                                  ).toLocaleString()}`
                                : "৳ 0.00"}
                            </td>
                            <td className="px-3 py-2 text-right space-x-1 md:space-x-2">
                              <button
                                onClick={() => handleEdit(c)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-blue-600 text-blue-600 text-[10px] md:text-xs hover:bg-blue-50"
                              >
                                <FaEdit className="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-red-600 text-red-600 text-[10px] md:text-xs hover:bg-red-50"
                              >
                                <FaTrash className="w-3 h-3" />
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Compact side form */}
          {showForm && (
            <div className="lg:w-80 xl:w-96 lg:border-l lg:border-slate-200 lg:pl-4">
              <div className="bg-slate-50/60 lg:bg-transparent rounded-xl lg:rounded-none lg:shadow-none shadow-sm p-3 lg:p-0 sticky lg:top-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {editingId ? "Edit Customer" : "Add Customer"}
                  </h3>
                  {editingId && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      ID: {editingId}
                    </span>
                  )}
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 gap-2 text-xs"
                >
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Customer Name *
                    </label>
                    <input
                      name="customer_name"
                      value={form.customer_name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring focus:ring-blue-500/30 bg-slate-50"
                    />
                  </div>

                  {/* Phone */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Phone 1
                      </label>
                      <input
                        name="phone1"
                        value={form.phone1}
                        onChange={handleFormChange}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring focus:ring-blue-500/30 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Email / DOB */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleFormChange}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  {/* Due */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Previous Due (৳)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="previous_due_amount"
                      value={form.previous_due_amount}
                      onChange={handleFormChange}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleFormChange}
                      rows={2}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetFormState}
                      className="px-3 py-1.5 rounded-full border border-slate-300 text-[11px] text-slate-700 hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-1.5 rounded-full bg-green-600 text-white text-[11px] font-medium hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving
                        ? editingId
                          ? "Updating..."
                          : "Saving..."
                        : editingId
                        ? "Update"
                        : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}