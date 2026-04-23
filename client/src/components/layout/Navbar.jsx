import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiChevronRight, FiLogOut, FiUser } from "react-icons/fi";
import { useUser } from "../../Provider/UserProvider";

const ROUTE_TITLES = [
  { prefix: "/staff",               label: "Staff" },
  { prefix: "/sales/invoice",       label: "Invoice" },
  { prefix: "/sales/payments",      label: "Payments" },
  { prefix: "/sales",               label: "Sales" },
  { prefix: "/people/payments",     label: "Payments" },
  { prefix: "/people",              label: "People" },
  { prefix: "/stock/purchase-import/history", label: "Import History" },
  { prefix: "/stock/purchase-import",         label: "Purchase Import" },
  { prefix: "/stock/inventory",     label: "Inventory" },
  { prefix: "/stock/products",      label: "Products" },
  { prefix: "/stock",               label: "Stock" },
  { prefix: "/expenses",            label: "Expenses" },
  { prefix: "/income",              label: "Incomes" },
  { prefix: "/accounting",          label: "Accounting" },
  { prefix: "/master",              label: "Master" },
  { prefix: "/profile",             label: "My Profile" },
  { prefix: "/dashboard",           label: "Dashboard" },
];

const ROLE_LABELS = {
  admin: "Admin",
  sales_representative: "Sales Representative",
  employee: "Employee",
  user: "User",
};

const ROLE_COLORS = {
  admin: "bg-violet-100 text-violet-700",
  sales_representative: "bg-sky-100 text-sky-700",
  employee: "bg-slate-100 text-slate-600",
  user: "bg-slate-100 text-slate-600",
};

function getInitials(user) {
  if (!user) return "?";
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  return "?";
}

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef(null);

  const title = ROUTE_TITLES.find((r) => location.pathname.startsWith(r.prefix))?.label ?? "Dashboard";
  const initials = getInitials(user);
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "User";
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || "Staff";
  const roleBadge = ROLE_COLORS[user?.role] || ROLE_COLORS.employee;

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-30">

      {/* Left — page title */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-tight">{title}</h2>
        <p className="text-xs text-slate-400 leading-tight">
          Manage your pharmacy data in one place.
        </p>
      </div>

      {/* Right — avatar + menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="User menu"
          className={`flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 transition
            ${menuOpen ? "bg-slate-100" : "hover:bg-slate-50"}`}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0 select-none">
            {initials}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">{fullName}</div>
            <div className="text-[11px] text-slate-400 capitalize">{roleLabel}</div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            className={`text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">

            {/* User info header */}
            <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 text-sm truncate">{fullName}</div>
                  <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadge}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-1.5">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <FiUser className="text-slate-400" size={15} />
                  My Profile
                </span>
                <FiChevronRight className="text-slate-300" size={14} />
              </button>
            </div>

            {/* Logout */}
            <div className="border-t border-slate-100 py-1.5">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <FiLogOut size={15} />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
