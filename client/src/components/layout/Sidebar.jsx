import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const menuConfig = [
  {
    title: "Dashboard",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    items: [{ label: "Overview", path: "/dashboard" }],
  },
  {
    title: "People",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
            <polyline points="16 7 22 7 22 13"/>
            </svg>`,
    items: [
      { label: "Customers", path: "/people/customers" },
      { label: "Payments", path: "/people/payments" },
    ],
  },
  {
    title: "Sales",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    items: [
      { label: "Sales", path: "/sales/sales-entry" },
      { label: "Payments", path: "/sales/payments" },
    ],
  },
  {
    title: "Stock",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>`,
    items: [
      { label: "Inventory", path: "/stock/inventory" },
      { label: "Products", path: "/stock/products" },
    ],
  },
  {
    title: "Purchase",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2l3 6"/><path d="M18 2l-3 6"/><path d="M3 10h18"/><path d="M5 10l1 10a2 2 0 002 2h8a2 2 0 002-2l1-10"/><path d="M9 14h6"/></svg>`,
    items: [
      { label: "Purchase Import", path: "/stock/purchase-import" },
      { label: "Import History", path: "/stock/purchase-import/history" },
    ],
  },
  {
    title: "Incomes",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>`,
    items: [{ label: "Income", path: "/income/incomes" }],
  },
  {
    title: "Expenses",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>`,
    items: [
      { label: "General Expense", path: "/expenses" },
      { label: "Salary Expense", path: "/expenses/salary" },
    ],
  },
  {
    title: "Accounting",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    items: [],
  },
  {
    title: "Master",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M20 12h2M2 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41"/></svg>`,
    items: [
      { label: "Payment Mode", path: "/master/payment-mode" },
      { label: "Bank Category", path: "/master/bank-category" },
      { label: "Bank", path: "/master/bank" },
      { label: "Bank Accounts", path: "/master/bank-accounts" },
    ],
  },
  {
    title: "Staffs",
    icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
    items: [
      { label: "Staff List", path: "/staff" },
    ],
  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (title) =>
    setOpenSection((prev) => (prev === title ? null : title));

  return (
    <aside className="w-72 bg-white h-screen sticky top-0 flex flex-col border-r border-gray-100">

      {/* Brand */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div
          onClick={() => navigate("/")}
          className="cursor-pointer"
        >
          <div className="text-lg font-semibold text-gray-900 leading-tight">
            StartMedical
          </div>
          <div className="text-[13px] text-gray-500 leading-tight">
            Pharmacy System
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {menuConfig.map((section) => {
          const hasSingleItem = section.items.length === 1;
          const hasNoItems = section.items.length === 0;
          const isOpen = openSection === section.title;

          return (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => {
                  if (hasSingleItem) navigate(section.items[0].path);
                  else if (!hasNoItems) toggleSection(section.title);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors group
                  ${hasNoItems
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-gray-50 cursor-pointer"
                  }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-gray-400 group-hover:text-emerald-500 transition-colors"
                    dangerouslySetInnerHTML={{ __html: section.icon }}
                  />
                  <span className="text-base text-gray-700 font-medium">
                    {section.title}
                  </span>
                  {hasNoItems && (
                    <span className="text-[10px] text-gray-300 font-normal">soon</span>
                  )}
                </div>
                {!hasSingleItem && !hasNoItems && (
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                )}
              </button>

              {/* Dropdown */}
              {!hasSingleItem && !hasNoItems && (
                <div className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-60" : "max-h-0"}`}>
                  <div className="ml-3 pl-3 border-l border-gray-100 my-1 space-y-0.5">
                    {section.items.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 font-semibold"
                              : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-300">v0.1 · bBOOK</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
          Beta
        </span>
      </div>
    </aside>
  );
}
