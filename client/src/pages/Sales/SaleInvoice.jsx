import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-hot-toast";

import salesService from "../../services/salesService";

const PAGE_SIZE_OPTIONS = [
  "a4",
  "a3",
  "a5",
  "letter",
  "legal",
  "tabloid",
  "ledger",
  "executive",
];

const PAGE_DIMENSIONS_MM = {
  a3: [297, 420],
  a4: [210, 297],
  a5: [148, 210],
  letter: [216, 279],
  legal: [216, 356],
  tabloid: [279, 432],
  ledger: [432, 279],
  executive: [184, 267],
};

const BANGLA_FONT_URL = "/fonts/NotoSansBengali-Regular.ttf";
const BANGLA_FONT_FILE = "NotoSansBengali-Regular.ttf";
const BANGLA_FONT_NAME = "NotoSansBengali";
let cachedBanglaFontBinary = null;

const COMPANY_INFO = {
  name: "StarMedical Pharma System",
  address: "Jashore, Bangladesh",
  phone: "+8801XXXXXXXXX",
  email: "support@starmedical.local",
  website: "www.starmedical.local",
};

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const arrayBufferToBinaryString = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
};

const applyBanglaFontToPdf = async (pdf) => {
  try {
    if (!cachedBanglaFontBinary) {
      const response = await fetch(BANGLA_FONT_URL);
      if (!response.ok) {
        return false;
      }

      const fontBuffer = await response.arrayBuffer();
      cachedBanglaFontBinary = arrayBufferToBinaryString(fontBuffer);
    }

    pdf.addFileToVFS(BANGLA_FONT_FILE, cachedBanglaFontBinary);
    pdf.addFont(BANGLA_FONT_FILE, BANGLA_FONT_NAME, "normal");
    return true;
  } catch (error) {
    console.error("Could not load Bangla font for PDF:", error);
    return false;
  }
};

export default function SaleInvoice() {
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [pageSize, setPageSize] = useState("a4");
  const invoiceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadInvoice = async () => {
      try {
        setLoading(true);
        const data = await salesService.getInvoice(invoiceId);
        if (isMounted) {
          setInvoice(data);
        }
      } catch (error) {
        console.error("Failed to load invoice:", error);
        if (isMounted) {
          toast.error("Failed to load invoice details.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (invoiceId) {
      loadInvoice();
    }

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  const invoiceRows = useMemo(() => {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    const minimumRows = 10;
    const placeholdersNeeded = Math.max(0, minimumRows - items.length);
    const placeholders = Array.from({ length: placeholdersNeeded }, (_, index) => ({
      __placeholder: true,
      id: `placeholder-${index}`,
    }));
    return [...items, ...placeholders];
  }, [invoice]);

  const previewWidth = useMemo(() => {
    const [rawWidth, rawHeight] = PAGE_DIMENSIONS_MM[pageSize] || PAGE_DIMENSIONS_MM.a4;
    const portraitWidth = Math.min(rawWidth, rawHeight);
    const a4PortraitWidth = 210;
    const baseA4WidthPx = 860;
    const scaledWidth = Math.round((portraitWidth / a4PortraitWidth) * baseA4WidthPx);
    return Math.max(620, scaledWidth);
  }, [pageSize]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !invoice) return;

    try {
      setDownloading(true);
      const pdf = new jsPDF("p", "mm", pageSize);
      const hasBanglaFont = await applyBanglaFontToPdf(pdf);

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const totalPages = pdf.getNumberOfPages();
      for (let page = 1; page <= totalPages; page += 1) {
        pdf.setPage(page);
        const currentPageHeight = pdf.internal.pageSize.getHeight();
        if (hasBanglaFont) {
          pdf.setFont(BANGLA_FONT_NAME, "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(90, 90, 90);
          pdf.text("বাংলা সমর্থিত ফার্মেসি ইনভয়েস", margin, currentPageHeight - 3);
        } else {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.setTextColor(90, 90, 90);
          pdf.text("Pharmacy invoice", margin, currentPageHeight - 3);
        }
      }

      pdf.save(`${invoice.sale_no || `invoice-${invoiceId}`}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Could not generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
          Loading invoice...
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-16 text-center text-red-700">
          Invoice not found.
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @page {
          margin: 10mm;
          size: auto;
        }

        @media print {
          .invoice-actions {
            display: none !important;
          }

          .invoice-preview-shell {
            border: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .invoice-page {
            width: 100% !important;
            min-height: auto !important;
            border: none !important;
            margin: 0 !important;
            padding: 6px !important;
          }

          .invoice-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .invoice-top-grid {
            gap: 6px !important;
          }

          .invoice-top-card {
            padding: 6px !important;
          }

          .invoice-items-table th,
          .invoice-items-table td {
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }

          .invoice-items-table tr {
            height: 30px !important;
          }

          .invoice-bottom-section {
            margin-top: 8px !important;
          }

          .invoice-total-card {
            padding: 8px !important;
          }

          body {
            background: #fff !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1600px] space-y-4 p-4 md:p-6">
        <div className="invoice-actions flex flex-wrap items-center justify-end gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-medium">Page Size</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none transition focus:border-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs text-slate-500">
            Preview: {pageSize.toUpperCase()} ({PAGE_DIMENSIONS_MM[pageSize]?.[0]}x{PAGE_DIMENSIONS_MM[pageSize]?.[1]}mm)
          </span>

          <button
            type="button"
            onClick={handlePrint}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {downloading ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>

        <div className="invoice-preview-shell overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 md:p-4">
          <section
            ref={invoiceRef}
            style={{ width: `${previewWidth}px` }}
            className="invoice-page mx-auto rounded-xl border border-slate-200 bg-white p-5 text-slate-800 md:p-7"
          >
            <div className="mb-5 border-t-4 border-blue-700 pt-3">
              <h1 className="text-4xl font-bold tracking-tight text-blue-800">INVOICE</h1>
            </div>

          <div className="invoice-top-grid grid grid-cols-3 gap-2.5">
            <div className="invoice-top-card rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <h2 className="text-sm font-bold uppercase text-slate-900">{COMPANY_INFO.name}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">{COMPANY_INFO.address}</p>
              <p className="text-xs leading-5 text-slate-600">{COMPANY_INFO.phone}</p>
              <p className="text-xs leading-5 text-slate-600">{COMPANY_INFO.email}</p>
              <p className="text-xs leading-5 text-slate-600">{COMPANY_INFO.website}</p>
            </div>

            <div className="invoice-top-card rounded-lg border border-slate-200 bg-white p-2.5">
              <h2 className="text-sm font-bold uppercase text-slate-900">Billed To</h2>
              <p className="mt-1 text-xs leading-5 text-slate-700">{invoice.customer_name || "Walk-in Customer"}</p>
              <p className="text-xs leading-5 text-slate-600">{invoice.contact_number || "No contact"}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Due: {formatCurrency(invoice.due_amount)}</p>
            </div>

            <div className="invoice-top-card rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="grid grid-cols-[88px_1fr] gap-x-2 gap-y-1 text-xs">
                <span className="font-semibold text-slate-700">Invoice No</span>
                <span className="text-slate-900">: {invoice.sale_no || "-"}</span>
                <span className="font-semibold text-slate-700">Issue Date</span>
                <span className="text-slate-900">: {formatDate(invoice.sale_date)}</span>
                <span className="font-semibold text-slate-700">Payment</span>
                <span className="text-slate-900">: {(invoice.payment_method || "cash").replaceAll("_", " ")}</span>
                <span className="font-semibold text-slate-700">Created At</span>
                <span className="text-slate-900">: {formatDate(invoice.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="invoice-avoid-break mt-4 overflow-hidden rounded-lg border border-slate-200">
            <table className="invoice-items-table min-w-full divide-y divide-slate-200 text-sm">
              <colgroup>
                <col style={{ width: "56%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead className="bg-blue-700 text-left text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-2 font-semibold">Items Description</th>
                  <th className="whitespace-nowrap px-4 py-2 text-right font-semibold">Qty</th>
                  <th className="whitespace-nowrap px-4 py-2 text-right font-semibold">Unit Price</th>
                  <th className="whitespace-nowrap px-4 py-2 text-right font-semibold">Discount</th>
                  <th className="whitespace-nowrap px-4 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoiceRows.map((item, index) => {
                  if (item.__placeholder) {
                    return (
                      <tr key={item.id} className="h-[42px]">
                        <td className="px-4 py-2 align-middle text-slate-300">&nbsp;</td>
                        <td className="px-4 py-2 text-right align-middle text-slate-300">&nbsp;</td>
                        <td className="px-4 py-2 text-right align-middle text-slate-300">&nbsp;</td>
                        <td className="px-4 py-2 text-right align-middle text-slate-300">&nbsp;</td>
                        <td className="px-4 py-2 text-right align-middle text-slate-300">&nbsp;</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={item.id || `item-${index}`} className="h-[42px]">
                      <td className="px-4 py-2 align-middle">
                        <div className="font-semibold text-slate-900">{item.item_name || item.product_name || "Product"}</div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-700 align-middle tabular-nums">{item.qty}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-700 align-middle tabular-nums">{formatCurrency(item.unit_price)}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-slate-700 align-middle tabular-nums">{Number(item.discount_percent || 0).toFixed(2)}%</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-900 align-middle tabular-nums">{formatCurrency(item.net_amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            <div className="invoice-avoid-break invoice-bottom-section mt-4 grid grid-cols-[1fr_220px] gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <h3 className="text-base font-bold text-blue-800">Thank You For Your Business</h3>
              <p className="mt-2 font-semibold text-slate-800">Payment Details</p>
              <p className="mt-1">Payment Method: {(invoice.payment_method || "cash").replaceAll("_", " ")}</p>
              <p>Amount: {Number(invoice.paid_amount || 0).toFixed(2)}</p>
            </div>

            <div className="invoice-total-card rounded-lg border border-slate-200 bg-white p-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sub Total</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">VAT</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(invoice.vat_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(invoice.discount_amount)}</span>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="flex items-center justify-between rounded-md bg-blue-700 px-3 py-2 text-white">
                  <span className="text-base font-bold">Total</span>
                  <span className="text-base font-bold">{formatCurrency(invoice.grand_total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Paid</span>
                  <span className="font-semibold text-emerald-700">{formatCurrency(invoice.paid_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Due</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(invoice.due_amount)}</span>
                </div>
              </div>
            </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
