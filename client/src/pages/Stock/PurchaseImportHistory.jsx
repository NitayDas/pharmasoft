import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaHistory,
  FaSearch,
  FaUserShield,
} from "react-icons/fa";

import purchaseService from "../../services/purchaseService";

const badgeTones = {
  created: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  updated: "bg-blue-50 text-blue-700 ring-blue-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function PurchaseImportHistory() {
  const [history, setHistory] = useState([]);
  const [selectedImportId, setSelectedImportId] = useState(null);
  const [selectedImport, setSelectedImport] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;
    return history.filter((item) =>
      [item.file_name, item.uploaded_by_username]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [history, search]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await purchaseService.getPurchases({ source: "excel" });
        setHistory(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedImportId(data[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load purchase import history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (!selectedImportId) {
      setSelectedImport(null);
      return;
    }

    const loadDetail = async () => {
      try {
        setLoadingDetail(true);
        setError("");
        const data = await purchaseService.getPurchaseDetail(selectedImportId);
        setSelectedImport(data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load import details.");
      } finally {
        setLoadingDetail(false);
      }
    };

    loadDetail();
  }, [selectedImportId]);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Purchase Import History</h1>
              <p className="mt-1 text-sm text-slate-500">
                Review every uploaded purchase file, who imported it, and how each row affected stock.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by file name or user"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Uploads</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {filteredHistory.length} records
                </span>
              </div>
            </div>

            {loading ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">Loading history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-slate-500">
                No purchase import history found yet.
              </div>
            ) : (
              <div className="max-h-[760px] overflow-y-auto p-3">
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedImportId(item.id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        selectedImportId === item.id
                          ? "border-blue-200 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{item.file_name}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <FaCalendarAlt className="text-slate-400" />
                            {formatDateTime(item.created_at)}
                          </div>
                        </div>
                        <FaChevronRight className="mt-1 shrink-0 text-xs text-slate-400" />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-2xl bg-white/80 px-2 py-2">
                          <div className="text-slate-400">Created</div>
                          <div className="mt-1 font-semibold text-slate-900">{item.created_products}</div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-2 py-2">
                          <div className="text-slate-400">Updated</div>
                          <div className="mt-1 font-semibold text-slate-900">{item.updated_products}</div>
                        </div>
                        <div className="rounded-2xl bg-white/80 px-2 py-2">
                          <div className="text-slate-400">Failed</div>
                          <div className="mt-1 font-semibold text-slate-900">{item.failed_rows}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="min-w-0 space-y-6">
            {loadingDetail ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-sm">
                Loading import details...
              </div>
            ) : !selectedImport ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-sm">
                Select an import record to review its audit details.
              </div>
            ) : (
              <>
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{selectedImport.file_name}</h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Complete audit summary for this upload, including every product row result.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <FaUserShield className="text-slate-400" />
                        Uploaded by: <span className="font-medium text-slate-800">{selectedImport.uploaded_by_username || "Unknown"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <FaClock className="text-slate-400" />
                        {formatDateTime(selectedImport.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {[
                      ["Rows Read", selectedImport.summary.total_rows, "border-slate-200 bg-slate-50 text-slate-900"],
                      ["Processed", selectedImport.summary.processed_rows, "border-blue-200 bg-blue-50 text-blue-900"],
                      ["Products Created", selectedImport.summary.created_products, "border-emerald-200 bg-emerald-50 text-emerald-900"],
                      ["Products Updated", selectedImport.summary.updated_products, "border-indigo-200 bg-indigo-50 text-indigo-900"],
                      ["Failed Rows", selectedImport.summary.failed_rows, "border-red-200 bg-red-50 text-red-900"],
                      ["Stock Added", selectedImport.summary.total_quantity_added, "border-amber-200 bg-amber-50 text-amber-900"],
                    ].map(([label, value, tone]) => (
                      <div key={label} className={`rounded-3xl border p-4 ${tone}`}>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="mt-3 text-3xl font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Row Results</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Track how each line in the uploaded file changed product inventory.
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {selectedImport.results.length} rows
                    </div>
                  </div>

                  {selectedImport.results.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                      This upload has no saved row results.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 font-medium">Row</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Product</th>
                            <th className="px-4 py-3 font-medium">SKU</th>
                            <th className="px-4 py-3 text-right font-medium">Added</th>
                            <th className="px-4 py-3 text-right font-medium">Before</th>
                            <th className="px-4 py-3 text-right font-medium">After</th>
                            <th className="px-4 py-3 font-medium">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedImport.results.map((row) => (
                            <tr key={row.id}>
                              <td className="px-4 py-3 text-slate-600">{row.row_number}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeTones[row.action]}`}
                                >
                                  {row.action === "failed" ? "Failed" : row.action === "created" ? "Created" : "Updated"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">{row.product_name || "N/A"}</td>
                              <td className="px-4 py-3 text-slate-600">{row.sku || "N/A"}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-800">{row.quantity_added}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{row.stock_before ?? "—"}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{row.stock_after ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{row.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      <h3 className="text-base font-semibold text-emerald-900">Audit Friendly</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-emerald-800">
                      You now have a permanent record of each uploaded file, the responsible user, and
                      the stock movement outcome for every row.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <div className="flex items-center gap-3">
                      <FaExclamationTriangle className="text-amber-600" />
                      <h3 className="text-base font-semibold text-amber-900">Follow-up Rows</h3>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-amber-800">
                      Failed rows stay visible here, which makes it easier to correct the source file and
                      re-import only the lines that need attention.
                    </p>
                  </div>
                </section>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
