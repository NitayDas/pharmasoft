import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProvider, useUser } from '../../Provider/UserProvider';
import salesService from '../../services/salesService';
import './DashboardPage.css';

const KPI_LABELS = [
  { label: 'Total Sales', accent: 'is-blue', key: 'total_sales' },
  { label: 'Total Discount', accent: 'is-violet', key: 'total_discount' },
  { label: 'Invoice Count', accent: 'is-orange', key: 'sale_count' },
];

const QUICK_ACTIONS = [
  { label: 'Pay with Points', color: 'is-indigo' },
  { label: 'Full Paid', color: 'is-amber' },
  { label: 'Cash Payment', color: 'is-green' },
  { label: 'Card Payment', color: 'is-teal' },
];

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [dashboardSummary, setDashboardSummary] = useState({
    total_sales: 0,
    total_discount: 0,
    sale_count: 0,
    latest_sale: null,
  });

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const data = await salesService.getDashboardSummary();
        if (active) setDashboardSummary(data);
      } catch {
        if (active) {
          setDashboardSummary({
            total_sales: 0,
            total_discount: 0,
            sale_count: 0,
            latest_sale: null,
          });
        }
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, []);

  const formatMoney = (value) => `৳ ${Number(value || 0).toLocaleString('en-BD')}`;
  const formatLabel = (value) => value ? value.replaceAll('_', ' ') : 'Cash';

  const latestSale = dashboardSummary.latest_sale;
  const invoiceRows = latestSale?.items || [];
  const invoiceNo = latestSale?.sale_no || 'No invoice yet';
  const invoiceDate = latestSale?.sale_date || '—';
  const subTotal = Number(latestSale?.subtotal || 0);
  const discountTotal = Number(latestSale?.discount_amount || 0);
  const netTotal = Number(latestSale?.grand_total || 0);
  const paidAmount = Number(latestSale?.paid_amount || 0);
  const dueAmount = Number(latestSale?.due_amount || 0);

  return (
    <main className="db-main">
      <section className="db-content">
        <div className="db-kpi-grid">
          {KPI_LABELS.map((item) => (
            <div key={item.label} className="db-card db-kpi-card">
              <div className="db-kpi-label">{item.label}</div>
              <div className={`db-kpi-value ${item.accent}`}>
                {item.key === 'sale_count'
                  ? dashboardSummary[item.key]
                  : formatMoney(dashboardSummary[item.key])}
              </div>
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
              <div className="db-invoice-chip">{latestSale ? 'Paid' : 'No Sale Yet'}</div>
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
                      <div className="db-meta-value">{latestSale?.served_by_username || user?.username || 'admin'}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Payment</div>
                      <div className="db-meta-value">{formatLabel(latestSale?.payment_method)}</div>
                    </div>
                  </div>
                </div>

                <div className="db-invoice-panel">
                  <div className="db-panel-title">Customer & Supplier</div>
                  <div className="db-party-grid">
                    <div>
                      <div className="db-meta-label">Customer</div>
                      <div className="db-meta-value">{latestSale?.customer_name || 'Walk-in Customer'}</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Supplier</div>
                      <div className="db-meta-value">Pharmacy Inventory</div>
                    </div>
                    <div>
                      <div className="db-meta-label">Reference</div>
                      <div className="db-meta-value">{latestSale?.notes || 'Prescription Sale'}</div>
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
                    Medicines once sold are not returnable unless a manufacturing defect is identified.
                    Please keep this invoice for warranty and compliance verification.
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
              <button key={action.label} type="button" className={`db-action-btn ${action.color}`}>
                {action.label}
              </button>
            ))}
          </aside>
        </div>
      </section>
    </main>
  );
}
