import { useEffect, useState } from "react";
import { FiEdit2, FiLock, FiSave, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useUser } from "../../Provider/UserProvider";
import staffService from "../../services/staffService";

const ROLE_LABELS = {
  admin: "Admin",
  sales_representative: "Sales Representative",
  employee: "Employee",
  user: "User",
};
const ROLE_BADGE = {
  admin: "bg-violet-100 text-violet-700",
  sales_representative: "bg-sky-100 text-sky-700",
  employee: "bg-slate-100 text-slate-600",
  user: "bg-slate-100 text-slate-600",
};

function buildError(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "An error occurred.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([f, msgs]) => `${f}: ${[].concat(msgs).join(" ")}`)
    .join("  |  ");
}

function getInitials(user) {
  if (!user) return "?";
  const f = user.first_name?.trim();
  const l = user.last_name?.trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  return (user.username || "?").slice(0, 2).toUpperCase();
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-slate-800">{value || <span className="text-slate-300 font-normal">Not set</span>}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useUser();
  const [staffProfile, setStaffProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ── Edit panel ───────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", phone: "", address: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // ── Password panel ───────────────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm_new_password: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwStrength, setPwStrength] = useState(0);

  const isAdminOrSuper = authUser?.is_superuser || authUser?.role === "admin";

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await staffService.me();
      setStaffProfile(data);
    } catch {
      // No staff profile — user is a superuser/plain user without staff record
      setStaffProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ── Edit helpers ─────────────────────────────────────────────
  const openEdit = () => {
    const u = staffProfile?.user || authUser;
    setEditForm({
      first_name: u?.first_name || "",
      last_name: u?.last_name || "",
      email: u?.email || "",
      phone: staffProfile?.phone || "",
      address: staffProfile?.address || "",
    });
    setEditError("");
    setEditOpen(true);
    setPwOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((p) => ({ ...p, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError("");
    try {
      await staffService.updateMe(editForm);
      await refreshUser();
      await fetchProfile();
      toast.success("Profile updated successfully.");
      setEditOpen(false);
    } catch (err) {
      setEditError(buildError(err));
    } finally {
      setEditSaving(false);
    }
  };

  // ── Password helpers ─────────────────────────────────────────
  const calcStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((p) => ({ ...p, [name]: value }));
    if (name === "new_password") setPwStrength(calcStrength(value));
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_new_password) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    setPwError("");
    try {
      await staffService.changePassword(staffProfile.id, pwForm);
      toast.success("Password changed. Please log in again with your new password.");
      setPwOpen(false);
      setPwForm({ old_password: "", new_password: "", confirm_new_password: "" });
      setPwStrength(0);
    } catch (err) {
      setPwError(buildError(err));
    } finally {
      setPwSaving(false);
    }
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][pwStrength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-emerald-500"][pwStrength];

  const displayUser = staffProfile?.user || authUser;
  const fullName = [displayUser?.first_name, displayUser?.last_name].filter(Boolean).join(" ") || displayUser?.username;
  const initials = getInitials(displayUser);
  const role = staffProfile?.role || displayUser?.role;

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {loadingProfile ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            Loading profile…
          </div>
        ) : (
          <>
            {/* ── Profile card ────────────────────────────── */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

              {/* Cover band */}
              <div className="h-20 bg-gradient-to-r from-emerald-500 to-teal-600" />

              {/* Avatar + header */}
              <div className="px-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 -mt-8">
                  <div className="flex items-end gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-white flex items-center justify-center text-xl font-bold text-emerald-700 bg-emerald-50 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-bold text-slate-900">{fullName}</h1>
                        {role && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[role] || "bg-slate-100 text-slate-600"}`}>
                            {ROLE_LABELS[role] || role}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{displayUser?.email}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pb-1">
                    {staffProfile && (
                      <button
                        type="button"
                        onClick={() => { setPwOpen((o) => !o); setEditOpen(false); }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition
                          ${pwOpen ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                      >
                        <FiLock size={13} />
                        Change Password
                      </button>
                    )}
                    {staffProfile && (
                      <button
                        type="button"
                        onClick={() => { editOpen ? setEditOpen(false) : openEdit(); setPwOpen(false); }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition
                          ${editOpen ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                      >
                        {editOpen ? <FiX size={13} /> : <FiEdit2 size={13} />}
                        {editOpen ? "Cancel" : "Edit Profile"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 border-t border-slate-100 pt-4">
                <InfoRow label="Username" value={displayUser?.username} />
                <InfoRow label="Employee ID" value={staffProfile?.employee_id} />
                <InfoRow label="Phone" value={displayUser?.phone || staffProfile?.phone} />
                <InfoRow label="Email" value={displayUser?.email} />
                <InfoRow label="Joined" value={staffProfile?.joining_date} />
                <InfoRow label="Status" value={
                  staffProfile
                    ? staffProfile.is_active
                      ? <span className="inline-flex items-center gap-1.5 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />Active</span>
                      : <span className="inline-flex items-center gap-1.5 text-red-600"><span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />Inactive</span>
                    : null
                } />
                {staffProfile?.address && (
                  <div className="col-span-2 sm:col-span-3 flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Address</span>
                    <span className="text-sm font-semibold text-slate-800">{staffProfile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Edit Profile panel ───────────────────────── */}
            {editOpen && staffProfile && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FiEdit2 size={15} className="text-emerald-600" />
                  Edit Profile
                </h2>
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">First Name</label>
                      <input
                        name="first_name"
                        value={editForm.first_name}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Last Name</label>
                      <input
                        name="last_name"
                        value={editForm.last_name}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                      <input
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Address</label>
                      <textarea
                        name="address"
                        value={editForm.address}
                        onChange={handleEditChange}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  {editError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editSaving}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <FiSave size={12} />
                      {editSaving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Change Password panel ────────────────────── */}
            {pwOpen && staffProfile && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FiLock size={15} className="text-amber-500" />
                  Change Password
                </h2>
                <form onSubmit={handlePwSubmit} className="space-y-3 max-w-md">
                  {/* Only non-admins changing their own password need to provide current password */}
                  {!isAdminOrSuper && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Current Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="old_password"
                        value={pwForm.old_password}
                        onChange={handlePwChange}
                        required
                        autoComplete="current-password"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
                    />
                    {pwForm.new_password && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength ? strengthColor : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <span className={`text-[11px] font-semibold ${["", "text-red-500", "text-amber-500", "text-blue-500", "text-emerald-600"][pwStrength]}`}>
                          {strengthLabel}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_new_password"
                      value={pwForm.confirm_new_password}
                      onChange={handlePwChange}
                      required
                      autoComplete="new-password"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:ring-4 focus:ring-amber-100
                        ${pwForm.confirm_new_password
                          ? pwForm.confirm_new_password === pwForm.new_password
                            ? "border-emerald-400"
                            : "border-red-300"
                          : "border-slate-200 focus:border-amber-400"
                        }`}
                    />
                    {pwForm.confirm_new_password && pwForm.confirm_new_password !== pwForm.new_password && (
                      <p className="mt-1 text-[11px] text-red-500">Passwords do not match.</p>
                    )}
                  </div>

                  {pwError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{pwError}</div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setPwOpen(false); setPwForm({ old_password: "", new_password: "", confirm_new_password: "" }); setPwStrength(0); setPwError(""); }}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pwSaving}
                      className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
                    >
                      <FiLock size={12} />
                      {pwSaving ? "Changing…" : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* No staff profile — superuser without staff record */}
            {!staffProfile && !loadingProfile && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
                No staff profile is linked to your account. Contact a system administrator.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
