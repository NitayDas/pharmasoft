import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { toast } from "react-hot-toast";

import salesService from "../../services/salesService";

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

export default function SaleInvoice() {
  const { invoiceId } = useParams();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);
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

  const paymentDetails = useMemo(() => {
    const notes = String(invoice?.notes || "");
    const lines = notes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      methodLine: lines.find((line) => line.toLowerCase().startsWith("mobile banking:")) ||
        lines.find((line) => line.toLowerCase().startsWith("bank name:")) ||
        `Payment Method: ${invoice?.payment_method || "cash"}`,
      amountLine: lines.find((line) => line.toLowerCase().startsWith("amount:")) ||
        `Amount: ${Number(invoice?.paid_amount || 0).toFixed(2)}`,
      noteLine: lines.find((line) => !line.toLowerCase().startsWith("mobile banking:") && !line.toLowerCase().startsWith("mobile number:") && !line.toLowerCase().startsWith("bank name:") && !line.toLowerCase().startsWith("account number:") && !line.toLowerCase().startsWith("amount:")) || "",
    };
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || !invoice) return;

    try {
      setDownloading(true);
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
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
        @media print {
          .invoice-actions {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
        <div className="invoice-actions flex items-center justify-end gap-3">
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

        <section ref={invoiceRef} className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 md:p-10">
          <div className="mb-8 border-t-4 border-blue-700 pt-4">
            <h1 className="text-5xl font-bold tracking-tight text-blue-800">INVOICE</h1>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900">{COMPANY_INFO.name}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{COMPANY_INFO.address}</p>
              <p className="text-sm leading-6 text-slate-600">{COMPANY_INFO.phone}</p>
              <p className="text-sm leading-6 text-slate-600">{COMPANY_INFO.email}</p>
              <p className="text-sm leading-6 text-slate-600">{COMPANY_INFO.website}</p>
            </div>

            <div>
              <h2 className="text-sm font-bold uppercase text-slate-900">Billed To</h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">{invoice.customer_name || "Walk-in Customer"}</p>
              <p className="text-sm leading-6 text-slate-600">{invoice.contact_number || "No contact"}</p>

              <div className="mt-5 grid grid-cols-[120px_1fr] gap-x-4 gap-y-1 text-sm">
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

          <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-blue-700 text-left text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Items Description</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Discount</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoice.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.item_name || item.product_name || "Product"}</div>
                      <div className="text-xs text-slate-500">SKU: {item.sku || "N/A"} | Batch: {item.batch || "N/A"} | Unit: {item.unit || "N/A"}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.qty}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{Number(item.discount_percent || 0).toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(item.net_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_300px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <h3 className="text-base font-bold text-blue-800">Thank You For Your Business</h3>
              <p className="mt-2 font-semibold text-slate-800">Payment Details</p>
              <p className="mt-1">{paymentDetails.methodLine}</p>
              <p>{paymentDetails.amountLine}</p>
              {paymentDetails.noteLine ? <p className="mt-2">Note: {paymentDetails.noteLine}</p> : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
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
    </>
  );
}
