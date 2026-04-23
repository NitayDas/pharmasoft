import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useUser } from '../../Provider/UserProvider';
import salesService from '../../services/salesService';
import './DashboardPage.css';

const TODAY_KPIS = [
  { label: "Today's Sales", accent: 'is-blue', key: 'total_sales', money: true },
  { label: "Today Collected", accent: 'is-emerald', key: 'today_collected', money: true },
  { label: "Today Invoices", accent: 'is-orange', key: 'sale_count', money: false },
];

const ALERT_KPIS = [
  { label: 'Outstanding Due', accent: 'is-red', key: 'total_outstanding_due', money: true },
  { label: 'Low Stock Items', accent: 'is-amber', key: 'low_stock_count', money: false },
  { label: 'Expiring Soon', accent: 'is-amber', key: 'expiring_soon_count', money: false, sub: '(30 days)' },
  { label: 'Expired Products', accent: 'is-rose', key: 'expired_count', money: false },
];

const QUICK_ACTIONS = [
  { label: 'Full Paid', color: 'is-amber', action: 'full_paid' },
  { label: 'Cash Payment', color: 'is-green', action: 'cash' },
  { label: 'Card Payment', color: 'is-teal', action: 'card' },
];

const EMPTY_SUMMARY = {
  total_sales: 0,
  total_discount: 0,
  sale_count: 0,
  today_collected: 0,
  total_outstanding_due: 0,
  low_stock_count: 0,
  expiring_soon_count: 0,
  expired_count: 0,
  latest_sale: null,
};

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [dashboardSummary, setDashboardSummary] = useState(EMPTY_SUMMARY);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [summaryData, invoicesData] = await Promise.all([
          salesService.getDashboardSummary(),
          salesService.getInvoices(),
        ]);

        if (!active) return;

        const normalizedInvoices = Array.isArray(invoicesData) ? invoicesData : [];
        const defaultInvoiceId = summaryData?.latest_sale?.id || normalizedInvoices[0]?.id || '';

        setDashboardSummary(summaryData || EMPTY_SUMMARY);
        setInvoices(normalizedInvoices);
        setSelectedInvoiceId((current) => current || String(defaultInvoiceId || ''));
      } catch {
        if (!active) return;
        setDashboardSummary(EMPTY_SUMMARY);
        setInvoices([]);
        setSelectedInvoiceId('');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const formatMoney = (value) => `৳ ${Number(value || 0).toLocaleString('en-BD')}`;
  const formatLabel = (value) =>
    value ? value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Cash';

  const selectedSale =
    invoices.find((sale) => String(sale.id) === String(selectedInvoiceId)) ||
    dashboardSummary.latest_sale;

  const invoiceRows = selectedSale?.items || [];
  const invoiceNo = selectedSale?.sale_no || 'No invoice yet';
  const invoiceDate = selectedSale?.sale_date || '—';
  const subTotal = Number(selectedSale?.subtotal || 0);
  const discountTotal = Number(selectedSale?.discount_amount || 0);
  const netTotal = Number(selectedSale?.grand_total || 0);
  const paidAmount = Number(selectedSale?.paid_amount || 0);
  const dueAmount = Number(selectedSale?.due_amount || 0);
  const statusLabel = !selectedSale
    ? 'No Sale Yet'
    : dueAmount <= 0
      ? 'Paid'
      : paidAmount > 0
        ? 'Partially Paid'
        : 'Unpaid';

  const syncInvoiceInState = (updatedSale) => {
    setInvoices((current) =>
      current.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
    );
    setDashboardSummary((current) => ({
      ...current,
      latest_sale:
        current.latest_sale?.id === updatedSale.id ? updatedSale : current.latest_sale,
    }));
    setSelectedInvoiceId(String(updatedSale.id));
  };

  const handleInvoiceAction = async (action) => {
    if (!selectedSale?.id) {
      toast.error('There is no invoice selected yet.');
      return;
    }

    if (action === 'points') {
      toast('Loyalty points payment is not configured in this version yet.');
      return;
    }

    const payload = {};
    if (action === 'full_paid') {
      payload.paid_amount = selectedSale.grand_total;
    } else if (action === 'cash') {
      payload.payment_method = 'cash';
      payload.paid_amount = selectedSale.grand_total;
    } else if (action === 'card') {
      payload.payment_method = 'card';
      payload.paid_amount = selectedSale.grand_total;
    }

    try {
      setActionLoading(action);
      const updatedSale = await salesService.updateInvoice(selectedSale.id, payload);
      syncInvoiceInState(updatedSale);
      toast.success(`Invoice ${updatedSale.sale_no} updated successfully.`);
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        error.response?.data?.paid_amount?.[0] ||
        'Failed to update invoice.'
      );
    } finally {
      setActionLoading('');
    }
  };

  return (
    <main className="db-main">
      <section className="db-content">
        <div className="db-kpi-grid">
          {TODAY_KPIS.map((item) => (
            <div key={item.label} className="db-card db-kpi-card">
              <div className="db-kpi-label">{item.label}</div>
              <div className={`db-kpi-value ${item.accent}`}>
                {item.money ? formatMoney(dashboardSummary[item.key]) : dashboardSummary[item.key]}
              </div>
            </div>
          ))}
        </div>

        <div className="db-kpi-grid-4">
          {ALERT_KPIS.map((item) => (
            <div key={item.label} className="db-card db-kpi-card">
              <div className="db-kpi-label">{item.label}</div>
              <div className={`db-kpi-value ${item.accent}`}>
                {item.money ? formatMoney(dashboardSummary[item.key]) : dashboardSummary[item.key]}
              </div>
              {item.sub && <div className="db-kpi-sub">{item.sub}</div>}
            </div>
          ))}
        </div>

        <div className="db-detail-grid">
          <div className="db-card">
            <div className="db-card-header">
              <div>
                <h2 className="db-card-title">Sales Invoice</h2>
                <p className="db-card-subtitle">Create, verify, and settle pharmacy sales records</p>
              </div>

              <div className="db-header-actions">
                <select
                  className="db-invoice-select"
                  value={selectedInvoiceId}
                  onChange={(event) => setSelectedInvoiceId(event.target.value)}
                  disabled={!invoices.length || loading}
                >
                  {!invoices.length ? (
                    <option value="">No invoices</option>
                  ) : (
                    invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.sale_no} · {invoice.customer_name}
                      </option>
                    ))
                  )}
                </select>
                <div className="db-invoice-chip">{statusLabel}</div>
              </div>
            </div>

            <div className="db-invoice-body">
              <div className="db-invoice-top-grid">
                <div className="db-invoice-panel">
                  <div className="db-panel-title">Invoice Details</div>
                  <div className="db-meta-grid">
                    <div>
                      <div className="db-meta-label">Invoice No</div>
                      <div className="db-meta-value">{invoiceNo}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Date</div>
                      <div className="db-meta-value">{invoiceDate}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Cashier</div>
                      <div className="db-meta-value">
                        {selectedSale?.served_by_username || user?.username || 'admin'}
                      </div>
                    </div>
                    <div>
                      <div className="db-meta-label">Payment</div>
                      <div className="db-meta-value">{formatLabel(selectedSale?.payment_method)}</div>
                    </div>
                  </div>
                </div>

                <div className="db-invoice-panel">
                  <div className="db-panel-title">Customer & Supplier</div>
                  <div className="db-party-grid">
                    <div>
                      <div className="db-meta-label">Customer</div>
                      <div className="db-meta-value">{selectedSale?.customer_name || 'Walk-in Customer'}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Supplier</div>
                      <div className="db-meta-value">Pharmacy Inventory</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Reference</div>
                      <div className="db-meta-value">{selectedSale?.notes || 'Prescription Sale'}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Branch</div>
                      <div className="db-meta-value">Main Outlet</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="db-table-wrap">
                <div className="db-table-head">
                  {['SL', 'SKU', 'Item', 'Unit', 'Qty', 'Rate', 'Discount', 'Amount', 'Net'].map((header) => (
                    <div key={header} className="db-table-header-cell">{header}</div>
                  ))}
                </div>

                {invoiceRows.length ? invoiceRows.map((row, index) => (
                  <div key={row.id} className={`db-table-row${index < invoiceRows.length - 1 ? ' has-border' : ''}`}>
                    <div className="db-table-cell">{String(index + 1).padStart(2, '0')}</div>
                    <div className="db-table-cell">{row.sku}</div>
                    <div className="db-table-cell strong">{row.item_name}</div>
                    <div className="db-table-cell">{row.unit}</div>
                    <div className="db-table-cell">{row.qty}</div>
                    <div className="db-table-cell">{formatMoney(row.unit_price)}</div>
                    <div className="db-table-cell">{row.discount_percent}%</div>
                    <div className="db-table-cell">{formatMoney(row.gross_amount)}</div>
                    <div className="db-table-cell strong">{formatMoney(row.net_amount)}</div>
                  </div>
                )) : (
                  <div className="db-empty-state">No sales have been created yet.</div>
                )}
              </div>

              <div className="db-invoice-bottom-grid">
                <div className="db-note-box">
                  <div className="db-panel-title">Notes</div>
                  <p className="db-note-text">
                    {selectedSale?.notes?.trim()
                      ? selectedSale.notes
                      : 'Medicines once sold are not returnable unless a manufacturing defect is identified. Please keep this invoice for warranty and compliance verification.'}
                  </p>
                </div>

                <div className="db-summary-box">
                  <div className="db-summary-row">
                    <span>Sub Total</span>
                    <strong>{formatMoney(subTotal)}</strong>
                  </div>
                  <div className="db-summary-row">
                    <span>Discount</span>
                    <strong>{formatMoney(discountTotal)}</strong>
                  </div>
                  <div className="db-summary-row">
                    <span>Net Total</span>
                    <strong>{formatMoney(netTotal)}</strong>
                  </div>
                  <div className="db-summary-row">
                    <span>Paid</span>
                    <strong>{formatMoney(paidAmount)}</strong>
                  </div>
                  <div className="db-summary-row is-total">
                    <span>Due</span>
                    <strong>{formatMoney(dueAmount)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="db-card db-actions-card">
            <div className="db-actions-title">Quick actions</div>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`db-action-btn ${action.color}`}
                onClick={() => handleInvoiceAction(action.action)}
                disabled={!selectedSale || actionLoading === action.action}
              >
                {actionLoading === action.action ? 'Updating...' : action.label}
              </button>
            ))}
            <button
              type="button"
              className="db-action-btn"
              onClick={() => navigate('/sales/payments')}
            >
              View All Invoices
            </button>

            {(user?.is_superuser || user?.role === 'admin') && (
              <>
                <div className="db-actions-divider" />
                <div className="db-actions-section-label">Staff</div>
                <button
                  type="button"
                  className="db-action-btn is-emerald"
                  onClick={() => navigate('/staff', { state: { openForm: true } })}
                >
                  + Create Staff
                </button>
                <button
                  type="button"
                  className="db-action-btn"
                  onClick={() => navigate('/staff')}
                >
                  Manage Staff
                </button>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
