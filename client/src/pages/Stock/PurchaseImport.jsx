import { Fragment, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaCloudUploadAlt,
  FaDownload,
  FaExclamationTriangle,
  FaFileExcel,
  FaFileUpload,
  FaHistory,
  FaPlus,
  FaSearch,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

import purchaseService from "../../services/purchaseService";
import stockService from "../../services/stockService";

const EMPTY_MANUAL_FORM = {
  name: "",
  sku: "",
  batch: "",
  unit: "Box",
  unit_price: "",
  purchase_quantity: "",
  is_active: true,
  notes: "",
};

const resultStyles = {
  created: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  updated: "bg-blue-50 text-blue-700 ring-blue-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
};

const sourceStyles = {
  excel: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  manual: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function PurchaseImport() {
  const [activeView, setActiveView] = useState("excel");
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingPurchaseDetail, setLoadingPurchaseDetail] = useState(false);

  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [importReport, setImportReport] = useState(null);

  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);

  const loadProducts = async () => {
    try {
      const data = await stockService.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    }
  };

  const loadPurchases = async (source = "") => {
    try {
      setLoadingPurchases(true);
      const params = source ? { source } : {};
      const data = await purchaseService.getPurchases(params);
      const normalized = Array.isArray(data) ? data : [];
      setPurchases(normalized);
      if (normalized.length > 0) {
        setSelectedPurchaseId((current) => current || normalized[0].id);
      } else {
        setSelectedPurchaseId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to load purchases.");
      setPurchases([]);
      setSelectedPurchaseId(null);
    } finally {
      setLoadingPurchases(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadPurchases();
  }, []);

  useEffect(() => {
    if (!selectedPurchaseId) {
      setSelectedPurchase(null);
      return;
    }

    const loadPurchaseDetail = async () => {
      try {
        setLoadingPurchaseDetail(true);
        const data = await purchaseService.getPurchaseDetail(selectedPurchaseId);
        setSelectedPurchase(data);
      } catch (err) {
        toast.error(err.response?.data?.detail || err.message || "Failed to load purchase details.");
        setSelectedPurchase(null);
      } finally {
        setLoadingPurchaseDetail(false);
      }
    };

    loadPurchaseDetail();
  }, [selectedPurchaseId]);

  const filteredPurchases = useMemo(() => {
    const query = purchaseSearch.trim().toLowerCase();
    if (!query) return purchases;
    return purchases.filter((purchase) =>
      [
        purchase.entry_no,
        purchase.file_name,
        purchase.source,
        purchase.created_by_username,
        ...purchase.results.map((item) => `${item.product_name} ${item.sku}`),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [purchaseSearch, purchases]);

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

  const matchedProduct = useMemo(() => {
    const sku = manualForm.sku.trim().toLowerCase();
    const name = manualForm.name.trim().toLowerCase();

    if (sku) {
      const exactSkuMatch = products.find((product) => product.sku?.trim().toLowerCase() === sku);
      if (exactSkuMatch) return exactSkuMatch;
    }

    if (name) {
      const exactNameMatch = products.find((product) => product.name?.trim().toLowerCase() === name);
      if (exactNameMatch) return exactNameMatch;
    }

    return null;
  }, [manualForm.name, manualForm.sku, products]);

  const downloadTemplate = () => {
    const url = "/templates/purchase-import-template.xlsx";
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "purchase-import-template.xlsx";
    anchor.click();
  };

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

  const handleImportSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a .xlsx or .csv file before importing.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const report = await purchaseService.importPurchaseExcel(file);
      setImportReport(report);
      await Promise.all([loadProducts(), loadPurchases()]);
      setSelectedPurchaseId(report.id);

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

  const handleManualChange = (event) => {
    const { name, value, type, checked } = event.target;
    setManualError("");
    setManualForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetManualForm = () => {
    setManualForm(EMPTY_MANUAL_FORM);
    setManualError("");
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();

    if (!manualForm.name.trim()) {
      setManualError("Product name is required.");
      return;
    }
    if (!manualForm.sku.trim()) {
      setManualError("SKU is required.");
      return;
    }
    if (!Number.isInteger(Number(manualForm.purchase_quantity)) || Number(manualForm.purchase_quantity) <= 0) {
      setManualError("Purchase quantity must be greater than zero.");
      return;
    }

    try {
      setManualSaving(true);
      setManualError("");
      const result = await purchaseService.createManualPurchase({
        ...manualForm,
        name: manualForm.name.trim(),
        sku: manualForm.sku.trim(),
        batch: manualForm.batch.trim(),
        unit: manualForm.unit.trim() || "Box",
      });
      await Promise.all([loadProducts(), loadPurchases()]);
      setSelectedPurchaseId(result.id);
      resetManualForm();
      setActiveView("list");
      toast.success("Manual purchase saved successfully.");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        (err.response?.data && typeof err.response.data === "object"
          ? Object.entries(err.response.data)
              .map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`)
              .join(" ")
          : err.message) ||
        "Failed to save manual purchase.";
      setManualError(detail);
      toast.error(detail);
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold text-slate-900">
                {activeView === "excel"
                  ? "Purchase Entry by Excel"
                  : activeView === "manual"
                    ? "Purchase"
                    : "Purchase List"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {activeView === "excel"
                  ? "Upload a purchase sheet to create missing products and add incoming purchase quantities directly into inventory."
                  : activeView === "manual"
                    ? "Create a normal purchase entry manually and let the system update stock immediately."
                    : "Review every purchase entry from Excel imports and manual purchases in one unified list."}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {[
                { key: "excel", label: "Purchase Entry by Excel" },
                { key: "manual", label: "Purchase" },
                { key: "list", label: "Purchase List" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeView === tab.key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeView === "excel" && (
            <>
              <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
                <form onSubmit={handleImportSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
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
                      dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-white"
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

                  <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FaDownload className="text-xs" />
                      Download Template
                    </button>

                    <div className="flex flex-col gap-2 sm:flex-row">
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
                        {uploading ? "Importing..." : "Purchase Entry by Excel"}
                      </button>
                    </div>
                  </div>
                </form>

                <aside className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Supported Columns</h2>
                    <Link
                      to="/stock/purchase-import/history"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FaHistory className="text-xs" />
                      Import History
                    </Link>
                  </div>

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

              {importReport && (
                <section className="mt-6 space-y-6">
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
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${resultStyles[result.action]}`}>
                                  {result.action === "failed" ? "Failed" : result.action === "created" ? "Created" : "Updated"}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">{result.product_name || "N/A"}</td>
                              <td className="px-4 py-3 text-slate-600">{result.sku || "N/A"}</td>
                              <td className="px-4 py-3 text-right font-medium text-slate-800">{result.quantity_added}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{result.stock_before ?? "—"}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{result.stock_after ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{result.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {activeView === "manual" && (
            <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <form onSubmit={handleManualSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Normal Purchase Entry</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Record a purchase by hand. Existing products will receive added stock; new
                      products will be created automatically.
                    </p>
                  </div>
                  {matchedProduct && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <div className="font-medium">Existing product detected</div>
                      <div className="mt-1 text-xs text-blue-600">
                        Current stock: {matchedProduct.stock_quantity} · Next stock:{" "}
                        {Number(matchedProduct.stock_quantity || 0) + Number(manualForm.purchase_quantity || 0)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={manualForm.name}
                      onChange={handleManualChange}
                      placeholder="Enter product name"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={manualForm.sku}
                      onChange={handleManualChange}
                      placeholder="Enter SKU"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Batch</label>
                    <input
                      type="text"
                      name="batch"
                      value={manualForm.batch}
                      onChange={handleManualChange}
                      placeholder="Optional batch number"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</label>
                    <input
                      type="text"
                      name="unit"
                      value={manualForm.unit}
                      onChange={handleManualChange}
                      placeholder="Box / Tablet / Capsule"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="unit_price"
                      value={manualForm.unit_price}
                      onChange={handleManualChange}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase Quantity</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      name="purchase_quantity"
                      value={manualForm.purchase_quantity}
                      onChange={handleManualChange}
                      placeholder="Enter received quantity"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
                  <textarea
                    name="notes"
                    value={manualForm.notes}
                    onChange={handleManualChange}
                    rows={4}
                    placeholder="Optional purchase note"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <label className="mt-4 inline-flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={manualForm.is_active}
                    onChange={handleManualChange}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Keep this product active for sales and inventory.
                </label>

                {manualError && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {manualError}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetManualForm}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={manualSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  >
                    {manualSaving ? <FaSyncAlt className="animate-spin text-xs" /> : <FaPlus className="text-xs" />}
                    {manualSaving ? "Saving..." : "Save Purchase"}
                  </button>
                </div>
              </form>

              <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Manual Purchase Logic</h2>
                <div className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="font-semibold text-slate-900">Existing product</div>
                    <p className="mt-2">
                      When SKU or exact product name matches, the incoming quantity is added to current stock
                      and the latest price, batch, and unit details are refreshed.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="font-semibold text-slate-900">New product</div>
                    <p className="mt-2">
                      If there is no existing match, the system creates the product automatically and opens
                      stock with the purchase quantity you entered.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                    Every manual purchase is also written to the unified purchase list for later review.
                  </div>
                </div>
              </aside>
            </div>
          )}

          {activeView === "list" && (
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">All Purchases</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      One unified table of all PU entries. Click a row to view its purchased item list.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {filteredPurchases.length} entries
                  </span>
                </div>

                <div className="relative mt-4 max-w-xl">
                  <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
                  <input
                    type="text"
                    value={purchaseSearch}
                    onChange={(event) => setPurchaseSearch(event.target.value)}
                    placeholder="Search by PU number, source, product, or user"
                    className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              {loadingPurchases ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">Loading purchases...</div>
              ) : filteredPurchases.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500">
                  No purchase entries found yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">PU No.</th>
                        <th className="px-4 py-3 font-medium">Source</th>
                        <th className="px-4 py-3 font-medium">File / Note</th>
                        <th className="px-4 py-3 text-right font-medium">Rows</th>
                        <th className="px-4 py-3 text-right font-medium">Created</th>
                        <th className="px-4 py-3 text-right font-medium">Updated</th>
                        <th className="px-4 py-3 text-right font-medium">Failed</th>
                        <th className="px-4 py-3 text-right font-medium">Qty Added</th>
                        <th className="px-4 py-3 font-medium">Created By</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPurchases.map((purchase) => {
                        const isExpanded = selectedPurchaseId === purchase.id;
                        const hasLoadedDetail = isExpanded && selectedPurchase?.id === purchase.id;

                        return (
                          <Fragment key={purchase.id}>
                            <tr
                              onClick={() =>
                                setSelectedPurchaseId((current) => (current === purchase.id ? null : purchase.id))
                              }
                              className={`cursor-pointer transition ${
                                isExpanded ? "bg-blue-50/60" : "hover:bg-slate-50"
                              }`}
                            >
                              <td className="px-4 py-3 font-semibold text-slate-900">{purchase.entry_no}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${sourceStyles[purchase.source]}`}>
                                  {purchase.source === "excel" ? "Excel" : "Manual"}
                                </span>
                              </td>
                              <td className="max-w-[260px] truncate px-4 py-3 text-slate-600">
                                {purchase.file_name || purchase.notes || "Normal purchase entry"}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">{purchase.total_rows}</td>
                              <td className="px-4 py-3 text-right text-emerald-700">{purchase.created_products}</td>
                              <td className="px-4 py-3 text-right text-blue-700">{purchase.updated_products}</td>
                              <td className="px-4 py-3 text-right text-red-700">{purchase.failed_rows}</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-900">{purchase.total_quantity_added}</td>
                              <td className="px-4 py-3 text-slate-600">{purchase.created_by_username || "Unknown"}</td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(purchase.created_at)}</td>
                            </tr>

                            {isExpanded && (
                              <tr className="bg-slate-50/70">
                                <td colSpan={10} className="px-4 pb-4 pt-1">
                                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                    {loadingPurchaseDetail && (
                                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        Loading purchase items...
                                      </div>
                                    )}

                                    {!loadingPurchaseDetail && hasLoadedDetail && (
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                                            <tr>
                                              <th className="px-4 py-3 font-medium">Status</th>
                                              <th className="px-4 py-3 font-medium">Product</th>
                                              <th className="px-4 py-3 font-medium">SKU</th>
                                              <th className="px-4 py-3 font-medium">Unit</th>
                                              <th className="px-4 py-3 text-right font-medium">Price</th>
                                              <th className="px-4 py-3 text-right font-medium">Added</th>
                                              <th className="px-4 py-3 text-right font-medium">Before</th>
                                              <th className="px-4 py-3 text-right font-medium">After</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 bg-white">
                                            {selectedPurchase.results.map((row) => (
                                              <tr key={row.id}>
                                                <td className="px-4 py-3">
                                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${resultStyles[row.action]}`}>
                                                    {row.action === "failed" ? "Failed" : row.action === "created" ? "Created" : "Updated"}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{row.product_name || "N/A"}</td>
                                                <td className="px-4 py-3 text-slate-600">{row.sku || "N/A"}</td>
                                                <td className="px-4 py-3 text-slate-600">{row.unit || "—"}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">
                                                  ৳ {Number(row.unit_price || 0).toLocaleString("en-BD")}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-800">{row.quantity_added}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{row.stock_before ?? "—"}</td>
                                                <td className="px-4 py-3 text-right text-slate-600">{row.stock_after ?? "—"}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}

                                    {!loadingPurchaseDetail && isExpanded && !hasLoadedDetail && (
                                      <div className="px-4 py-8 text-center text-sm text-slate-500">
                                        Loading purchase items...
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </section>
      </div>
    </div>
  );
}
