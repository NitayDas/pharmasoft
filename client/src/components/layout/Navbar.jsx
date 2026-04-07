import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../Provider/UserProvider";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);


  const getTitle = () => {
    if (location.pathname.startsWith("/sales")) return "Sales";
    if (location.pathname.startsWith("/purchases")) return "Purchases";
    if (location.pathname.startsWith("/expenses")) return "Expenses";
    if (location.pathname.startsWith("/accounting")) return "Accounting";
    if (location.pathname.startsWith("/stock")) return "Stock";
    if (location.pathname.startsWith("/assets")) return "Assets";
    if (location.pathname.startsWith("/reports")) return "Reports";
    return "Dashboard";
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">

      {/* LEFT SIDE */}
      <div>
        <h2 className="text-lg font-semibold">{getTitle()}{}</h2>
        <p className="text-xs text-slate-500">
          Manage your Customers, stock, and sales in one place.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4">

        {/* USER MENU */}
        <div className="relative">
          <div
            className="w-9 h-9 p-1 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 cursor-pointer"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            {user?.username?.slice(0, 2)?.toUpperCase()}
          </div>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-md py-2 z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate("/dashboard/profile");
                }}
              >
                Profile
              </button>

              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                onClick={() => {
                  logout();
                  window.location.href = "/";
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}