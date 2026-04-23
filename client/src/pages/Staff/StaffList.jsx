import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaEdit, FaKey, FaPlus, FaSearch, FaUserCheck, FaUserSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useUser } from "../../Provider/UserProvider";
import staffService from "../../services/staffService";

const ROLE_LABELS = {
  admin: "Admin",
  sales_representative: "Sales Representative",
};

const ROLE_BADGE = {
  admin: "bg-violet-100 text-violet-700",
  sales_representative: "bg-sky-100 text-sky-700",
};

const EMPTY_STAFF_FORM = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  role: "sales_representative",
  joining_date: new Date().toISOString().slice(0, 10),
  password: "",
  confirm_password: "",
};

const EMPTY_PW_FORM = {
  old_password: "",
  new_password: "",
  confirm_new_password: "",
};

function buildFieldErrors(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "An error occurred.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([f, msgs]) => `${f}: ${[].concat(msgs).join(" ")}`)
    .join("  |  ");
}

export default function StaffList() {
  const { user: currentUser } = useUser();
  const location = useLocation();
  const isAdminOrSuper =
    currentUser?.is_superuser || currentUser?.role === "admin";

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  // ── Create / Edit panel ─────────────────────────────────────
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [saving, setSaving] = useState(false);

  // ── Change-password modal ────────────────────────────────────
  const [pwTarget, setPwTarget] = useState(null); // staff object
  const [pwForm, setPwForm] = useState(EMPTY_PW_FORM);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  // ── Deactivate confirm ───────────────────────────────────────
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => {
      const name = `${s.user?.first_name || ""} ${s.user?.last_name || ""} ${s.user?.username || ""}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || (s.user?.email || "").toLowerCase().includes(q) || s.employee_id.toLowerCase().includes(q);
      const matchRole = !roleFilter || s.role === roleFilter;
      const matchStatus = statusFilter === "" ? true : String(s.is_active) === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [staffList, search, roleFilter, statusFilter]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await staffService.list();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(buildFieldErrors(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Auto-open the create form when navigated from dashboard with state
  useEffect(() => {
    if (location.state?.openForm && isAdminOrSuper) {
      openCreateForm();
      // Clear the state so refreshing the page doesn't re-open it
      window.history.replaceState({}, '');
    }
  }, [location.state, isAdminOrSuper]);

  // ── Staff form helpers ───────────────────────────────────────
  const openCreateForm = () => {
    setEditingId(null);
    setStaffForm(EMPTY_STAFF_FORM);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (staff) => {
    setEditingId(staff.id);
    setStaffForm({
      username: staff.user?.username || "",
      first_name: staff.user?.first_name || "",
      last_name: staff.user?.last_name || "",
      email: staff.user?.email || "",
      phone: staff.phone || "",
      address: staff.address || "",
      role: staff.role || "sales_representative",
      joining_date: staff.joining_date || new Date().toISOString().slice(0, 10),
      password: "",
      confirm_password: "",
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const payload = {
          role: staffForm.role,
          phone: staffForm.phone,
          address: staffForm.address,
          joining_date: staffForm.joining_date,
          first_name: staffForm.first_name,
          last_name: staffForm.last_name,
          email: staffForm.email,
        };
        await staffService.update(editingId, payload);
        toast.success("Staff updated successfully.");
      } else {
        await staffService.create(staffForm);
        toast.success("Staff created successfully.");
      }
      closeForm();
      await fetchStaff();
    } catch (err) {
      setError(buildFieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Password modal helpers ───────────────────────────────────
  const openPwModal = (staff) => {
    setPwTarget(staff);
    setPwForm(EMPTY_PW_FORM);
    setPwError("");
  };

  const closePwModal = () => {
    if (pwSaving) return;
    setPwTarget(null);
    setPwError("");
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const isSelfPwChange = pwTarget && currentUser && pwTarget.user?.id === currentUser.id;

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await staffService.changePassword(pwTarget.id, pwForm);
      toast.success("Password changed successfully.");
      closePwModal();
    } catch (err) {
      setPwError(buildFieldErrors(err));
    } finally {
      setPwSaving(false);
    }
  };

  // ── Deactivate helpers ───────────────────────────────────────
  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await staffService.deactivate(deactivateTarget.id);
      toast.success(`${deactivateTarget.user?.first_name || deactivateTarget.user?.username} deactivated.`);
      setDeactivateTarget(null);
      await fetchStaff();
    } catch (err) {
      toast.error(buildFieldErrors(err));
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = async (staff) => {
    try {
      await staffService.activate(staff.id);
      toast.success(`${staff.user?.first_name || staff.user?.username} activated.`);
      await fetchStaff();
    } catch (err) {
      toast.error(buildFieldErrors(err));
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage staff accounts, roles, and passwords.
            </p>
          </div>

          {isAdminOrSuper && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <FaPlus className="text-xs" />
              Add Staff
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sales_representative">Sales Representative</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Main content */}
        <div className={`mt-5 flex flex-col gap-5 ${showForm ? "xl:flex-row" : ""}`}>

          {/* Table */}
          <section className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Staff List</h2>
              <span className="text-xs text-slate-500">
                {filtered.length} member{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
                Loading staff…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
                No staff found. {isAdminOrSuper && "Add your first staff member."}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Staff Member</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium">Username</th>
                        <th className="px-4 py-3 font-medium">Contact</th>
                        <th className="px-4 py-3 font-medium">Joined</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filtered.map((staff) => {
                        const name =
                          [staff.user?.first_name, staff.user?.last_name].filter(Boolean).join(" ") ||
                          staff.user?.username;
                        const initials = name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase();
                        const isSelf = currentUser && staff.user?.id === currentUser.id;

                        return (
                          <tr key={staff.id} className="align-middle hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono text-xs text-slate-500">
                              {staff.employee_id}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 flex-shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {name}
                                    {isSelf && (
                                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500">{staff.user?.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  ROLE_BADGE[staff.role] || "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {ROLE_LABELS[staff.role] || staff.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                              {staff.user?.username}
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs">
                              {staff.phone || <span className="text-slate-400">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">
                              {staff.joining_date || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                  staff.is_active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    staff.is_active ? "bg-emerald-500" : "bg-red-500"
                                  }`}
                                />
                                {staff.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1.5">
                                {/* Edit — admin/super only */}
                                {isAdminOrSuper && (
                                  <button
                                    type="button"
                                    onClick={() => openEditForm(staff)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                  >
                                    <FaEdit className="text-[10px]" />
                                    Edit
                                  </button>
                                )}

                                {/* Change password — self or admin/super */}
                                {(isAdminOrSuper || isSelf) && (
                                  <button
                                    type="button"
                                    onClick={() => openPwModal(staff)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                                  >
                                    <FaKey className="text-[10px]" />
                                    Password
                                  </button>
                                )}

                                {/* Activate / Deactivate — admin/super only */}
                                {isAdminOrSuper && !isSelf && (
                                  staff.is_active ? (
                                    <button
                                      type="button"
                                      onClick={() => setDeactivateTarget(staff)}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                                    >
                                      <FaUserSlash className="text-[10px]" />
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleActivate(staff)}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                                    >
                                      <FaUserCheck className="text-[10px]" />
                                      Activate
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Create / Edit side panel */}
          {showForm && isAdminOrSuper && (
            <aside className="xl:w-[380px] xl:border-l xl:border-slate-200 xl:pl-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {editingId ? "Edit Staff" : "Add Staff"}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {editingId
                        ? "Update staff details and role."
                        : "Create a new user account for this staff member."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleStaffSubmit} className="space-y-3">
                  {/* Username — create only */}
                  {!editingId && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="username"
                        value={staffForm.username}
                        onChange={handleStaffFormChange}
                        required
                        autoComplete="off"
                        placeholder="e.g. john_doe"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Staff will use this to log in.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        First Name
                      </label>
                      <input
                        name="first_name"
                        value={staffForm.first_name}
                        onChange={handleStaffFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Last Name
                      </label>
                      <input
                        name="last_name"
                        value={staffForm.last_name}
                        onChange={handleStaffFormChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={staffForm.email}
                      onChange={handleStaffFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Phone
                    </label>
                    <input
                      name="phone"
                      value={staffForm.phone}
                      onChange={handleStaffFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: "admin", label: "Admin" },
                        { value: "sales_representative", label: "Sales Rep" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                            staffForm.role === opt.value
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-medium"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={opt.value}
                            checked={staffForm.role === opt.value}
                            onChange={handleStaffFormChange}
                            className="accent-emerald-600"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      name="joining_date"
                      value={staffForm.joining_date}
                      onChange={handleStaffFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={staffForm.address}
                      onChange={handleStaffFormChange}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  {/* Password fields — create only */}
                  {!editingId && (
                    <>
                      <div className="border-t border-slate-200 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Set Password
                        </p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={staffForm.password}
                          onChange={handleStaffFormChange}
                          required
                          autoComplete="new-password"
                          minLength={8}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          value={staffForm.confirm_password}
                          onChange={handleStaffFormChange}
                          required
                          autoComplete="new-password"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>
                    </>
                  )}

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="min-w-[140px] rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? editingId ? "Updating…" : "Creating…"
                        : editingId ? "Update Staff" : "Create Staff"}
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ── Change Password Modal ────────────────────────────── */}
      {pwTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  {[pwTarget.user?.first_name, pwTarget.user?.last_name].filter(Boolean).join(" ") || pwTarget.user?.username}
                  {" "}·{" "}
                  <span className="font-mono text-xs">{pwTarget.employee_id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closePwModal}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePwSubmit} className="space-y-3">
              {/* Old password only required when staff changes own password and is not admin */}
              {isSelfPwChange && !isAdminOrSuper && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="old_password"
                    value={pwForm.old_password}
                    onChange={handlePwChange}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="new_password"
                  value={pwForm.new_password}
                  onChange={handlePwChange}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_new_password"
                  value={pwForm.confirm_new_password}
                  onChange={handlePwChange}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {pwError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {pwError}
                </div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePwModal}
                  disabled={pwSaving}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pwSaving ? "Changing…" : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirm Modal ─────────────────────────── */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 flex-shrink-0">
                <FaUserSlash className="text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Deactivate staff member?</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
                  This will prevent{" "}
                  <span className="font-semibold text-slate-800">
                    {[deactivateTarget.user?.first_name, deactivateTarget.user?.last_name]
                      .filter(Boolean)
                      .join(" ") || deactivateTarget.user?.username}
                  </span>{" "}
                  from logging in. You can reactivate them at any time.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Staff Details
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div><span className="font-medium text-slate-800">Employee ID:</span> {deactivateTarget.employee_id}</div>
                <div><span className="font-medium text-slate-800">Username:</span> {deactivateTarget.user?.username}</div>
                <div><span className="font-medium text-slate-800">Role:</span> {ROLE_LABELS[deactivateTarget.role] || deactivateTarget.role}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                disabled={deactivating}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeactivate}
                disabled={deactivating}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deactivating ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
