import { useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaFileUpload,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

import salesService from "../../services/salesService";

const TEMPLATE_HEADERS = [
  "product_name",
  "sku",
  "batch",
  "unit",
  "unit_price",
  "purchase_quantity",
  "is_active",
];

const TEMPLATE_SAMPLE = [
  "Azithromycin 500mg",
  "AZI-500",
  "AZ12",
  "Box",
  "250.00",
  "25",
  "true",
];

const resultStyles = {
  created: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  updated: "bg-blue-50 text-blue-700 ring-blue-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

export default function PurchaseImport() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [importReport, setImportReport] = useState(null);

  const summaryCards = useMemo(() => {
    if (!importReport?.summary) return [];

    const { summary } = importReport;
    return [
      {
        label: "Rows Read",
        value: summary.total_rows,
        tone: "border-slate-200 bg-slate-50 text-slate-900",
      },
      {
        label: "Processed",
        value: summary.processed_rows,
        tone: "border-blue-200 bg-blue-50 text-blue-900",
      },
      {
        label: "Products Created",
        value: summary.created_products,
        tone: "border-emerald-200 bg-emerald-50 text-emerald-900",
      },
      {
        label: "Products Updated",
        value: summary.updated_products,
        tone: "border-indigo-200 bg-indigo-50 text-indigo-900",
      },
      {
        label: "Failed Rows",
        value: summary.failed_rows,
        tone: "border-red-200 bg-red-50 text-red-900",
      },
      {
        label: "Stock Added",
        value: summary.total_quantity_added,
        tone: "border-amber-200 bg-amber-50 text-amber-900",
      },
    ];
  }, [importReport]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    setError("");
    setFile(selectedFile);
  };

  const resetImportState = () => {
    setFile(null);
    setError("");
    setImportReport(null);
  };

  const downloadTemplate = () => {
    const content = [TEMPLATE_HEADERS.join(","), TEMPLATE_SAMPLE.join(",")].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "product-purchase-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a .xlsx or .csv file before importing.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const report = await salesService.importProductPurchases(file);
      setImportReport(report);

      if (report.summary.failed_rows > 0) {
        toast.success("Import completed with a few rows that need attention.");
      } else {
        toast.success("Purchase file imported successfully.");
      }
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Failed to import purchase file.";
      setError(detail);
      toast.error(detail);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold text-slate-900">Purchase Excel Import</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload a purchase sheet to create missing products and add incoming purchase quantities
                directly into inventory. Existing products are matched by SKU first, then by exact
                product name.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              <FaDownload className="text-xs" />
              Download Template
            </button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  handleFileSelect(event.dataTransfer.files?.[0]);
                }}
                className={`rounded-3xl border-2 border-dashed p-6 transition ${
                  dragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-300 bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <FaFileExcel className="text-2xl" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-900">Upload Purchase Sheet</h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Drag and drop a purchase file here, or browse from your device. Accepted formats:
                    <span className="font-medium text-slate-700"> .xlsx </span>
                    and
                    <span className="font-medium text-slate-700"> .csv</span>.
                  </p>

                  <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                    <FaFileUpload className="text-xs" />
                    Choose File
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(event) => handleFileSelect(event.target.files?.[0])}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <div className="font-medium">{file.name}</div>
                      <div className="mt-1 text-xs text-emerald-600">
                        Ready to import into product and stock records.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetImportState}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {uploading ? <FaSyncAlt className="animate-spin text-xs" /> : <FaCloudUploadAlt className="text-sm" />}
                  {uploading ? "Importing..." : "Import Purchase File"}
                </button>
              </div>
            </form>

            <aside className="rounded-3xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">Supported Columns</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the template or keep these column names in your sheet. Common aliases like
                <span className="font-medium text-slate-700"> qty</span>,
                <span className="font-medium text-slate-700"> price</span>, and
                <span className="font-medium text-slate-700"> product_name</span> are also accepted.
              </p>

              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Column</th>
                      <th className="px-4 py-3 font-medium">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {[
                      ["product_name", "For new products"],
                      ["sku", "Recommended for matching"],
                      ["batch", "Optional"],
                      ["unit", "Optional"],
                      ["unit_price", "Optional"],
                      ["purchase_quantity", "Yes"],
                      ["is_active", "Optional"],
                    ].map(([label, requirement]) => (
                      <tr key={label}>
                        <td className="px-4 py-3 font-medium text-slate-800">{label}</td>
                        <td className="px-4 py-3 text-slate-600">{requirement}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="mt-0.5 text-amber-500" />
                  <p>
                    Existing products are updated by adding the imported purchase quantity to current
                    stock. New products are created when a matching SKU or name is not found.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {importReport && (
          <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.label} className={`rounded-3xl border p-4 ${card.tone}`}>
                  <div className="text-sm font-medium">{card.label}</div>
                  <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Import Results</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review exactly which rows created products, increased stock, or need correction.
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {importReport.results.length} row results
                </div>
              </div>

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
                    {importReport.results.map((result) => (
                      <tr key={`${result.row_number}-${result.sku || result.product_name || "row"}`}>
                        <td className="px-4 py-3 text-slate-600">{result.row_number}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              resultStyles[result.action]
                            }`}
                          >
                            {result.action === "failed" ? "Failed" : result.action === "created" ? "Created" : "Updated"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{result.product_name || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600">{result.sku || "N/A"}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">{result.quantity_added}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {result.stock_before ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {result.stock_after ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{result.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="text-emerald-600" />
                  <h3 className="text-base font-semibold text-emerald-900">Stock Update Logic</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-emerald-800">
                  Each successful row adds the purchase quantity to the existing stock balance, so the
                  inventory page immediately reflects the new received quantity.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="text-sm font-medium text-slate-500">Quick Summary</div>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>Total quantity added</span>
                    <span className="font-semibold text-slate-900">
                      {importReport.summary.total_quantity_added}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Successful rows</span>
                    <span className="font-semibold text-slate-900">
                      {importReport.summary.processed_rows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rows needing correction</span>
                    <span className="font-semibold text-slate-900">
                      {importReport.summary.failed_rows}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
