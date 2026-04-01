import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { salesService } from '../../services/salesService';
import './SalesPage.css';

const PAYMENT_METHODS = ['Cash', 'Card', 'Mobile Banking'];

const emptyDraft = {
  productId: '',
  itemName: '',
  batch: '',
  unit: 'Box',
  qty: '1',
  unitPrice: '',
  discountPercent: '0',
};

export default function SalesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [draftItem, setDraftItem] = useState(emptyDraft);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      try {
        const data = await salesService.getProducts();
        if (!active) return;

        setProducts(data);

        if (data.length > 0) {
          const firstProduct = data[0];
          setDraftItem({
            productId: String(firstProduct.id),
            itemName: firstProduct.name,
            batch: firstProduct.batch || '',
            unit: firstProduct.unit || 'Box',
            qty: '1',
            unitPrice: String(firstProduct.unit_price),
            discountPercent: '0',
          });
        }
      } catch {
        if (active) {
          setErrorMessage('Unable to load products from the database.');
        }
      } finally {
        if (active) {
          setLoadingProducts(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const handleProductChange = (productId) => {
    const selectedProduct = products.find((product) => String(product.id) === productId);
    if (!selectedProduct) return;

    setDraftItem({
      productId,
      itemName: selectedProduct.name,
      batch: selectedProduct.batch || '',
      unit: selectedProduct.unit || 'Box',
      qty: '1',
      unitPrice: String(selectedProduct.unit_price),
      discountPercent: '0',
    });
  };

  const totals = useMemo(() => {
    const subtotal = saleItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
    const discount = saleItems.reduce((sum, item) => {
      const gross = item.qty * item.unitPrice;
      return sum + (gross * item.discountPercent) / 100;
    }, 0);
    const vat = Math.round(subtotal * 0.03);
    const grandTotal = subtotal - discount + vat;
    const paid = grandTotal;
    const due = 0;

    return { subtotal, discount, vat, grandTotal, paid, due };
  }, [saleItems]);

  const handleDraftChange = (field, value) => {
    setDraftItem((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    if (!draftItem.productId) return;

    const qty = Number(draftItem.qty);
    const unitPrice = Number(draftItem.unitPrice);
    const discountPercent = Number(draftItem.discountPercent || 0);

    if (
      qty <= 0 ||
      unitPrice <= 0 ||
      discountPercent < 0 ||
      discountPercent > 100 ||
      Number.isNaN(qty) ||
      Number.isNaN(unitPrice) ||
      Number.isNaN(discountPercent)
    ) {
      return;
    }

    const selectedProduct = products.find((product) => String(product.id) === draftItem.productId);
    if (!selectedProduct) return;

    setSaleItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        productId: selectedProduct.id,
        name: draftItem.itemName.trim(),
        batch: draftItem.batch.trim(),
        unit: draftItem.unit || selectedProduct.unit || 'Box',
        qty,
        unitPrice,
        discountPercent,
      },
    ]);

    setDraftItem((prev) => ({
      ...prev,
      qty: '1',
      discountPercent: '0',
    }));
  };

  const handleRemoveItem = (id) => {
    setSaleItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveSale = async () => {
    if (!saleItems.length) {
      setErrorMessage('Add at least one item before saving the sale.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const payload = {
        customer_name: 'Walk-in Customer',
        contact_number: '',
        sale_date: new Date().toISOString().slice(0, 10),
        served_by: user.id,
        payment_method: paymentMethod,
        notes: '',
        items: saleItems.map((item) => ({
          product: item.productId,
          item_name: item.name,
          batch: item.batch,
          unit: item.unit,
          qty: item.qty,
          unit_price: item.unitPrice,
          discount_percent: item.discountPercent,
        })),
      };

      await salesService.createSale(payload);
      setSaleItems([]);
      setStatusMessage('Sale saved successfully.');
    } catch (error) {
      const message = error.response?.data?.items?.[0]
        || error.response?.data?.detail
        || 'Unable to save sale. Please try again.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const money = (value) => `BDT ${value.toLocaleString('en-BD')}`;

  return (
    <div className="sp-page">
      <div className="sp-shell">
        <header className="sp-header">
          <div>
            <p className="sp-kicker">Pharmacy POS</p>
            <h1 className="sp-title">Sales Entry</h1>
          </div>
          <div className="sp-header-actions">
            <button type="button" className="sp-btn sp-btn-muted" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
            <button type="button" className="sp-btn sp-btn-primary" onClick={handleSaveSale} disabled={saving}>
              {saving ? 'Saving...' : 'Save Sale'}
            </button>
          </div>
        </header>

        {errorMessage ? <div className="sp-alert is-error" role="alert">{errorMessage}</div> : null}
        {statusMessage ? <div className="sp-alert is-success" role="status">{statusMessage}</div> : null}

        <section className="sp-grid">
          <article className="sp-card">
            <div className="sp-card-head">
              <h2>Sale Information</h2>
              <span className="sp-badge">Invoice #SL-2026-0412</span>
            </div>

            <div className="sp-form-grid">
              <label className="sp-field">
                <span>Customer Name</span>
                <input type="text" defaultValue="Walk-in Customer" />
              </label>
              <label className="sp-field">
                <span>Contact Number</span>
                <input type="text" defaultValue="01XXXXXXXXX" />
              </label>
              <label className="sp-field">
                <span>Sale Date</span>
                <input type="text" defaultValue="02 Apr 2026" />
              </label>
              <label className="sp-field">
                <span>Served By</span>
                <input type="text" defaultValue={user?.username || 'admin'} />
              </label>
            </div>

            <div className="sp-add-item">
              <h3 className="sp-subtitle">Add Item</h3>
              {loadingProducts ? <div className="sp-help-text">Loading product catalog...</div> : null}
              <div className="sp-add-grid">
                <label className="sp-field">
                  <span>Product</span>
                  <select
                    value={draftItem.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    <option value="" disabled>
                      {loadingProducts ? 'Loading products...' : 'Select product'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sp-field">
                  <span>Item Name</span>
                  <input
                    type="text"
                    value={draftItem.itemName}
                    onChange={(e) => handleDraftChange('itemName', e.target.value)}
                  />
                </label>
                <label className="sp-field">
                  <span>Batch</span>
                  <input
                    type="text"
                    value={draftItem.batch}
                    onChange={(e) => handleDraftChange('batch', e.target.value)}
                  />
                </label>
                <label className="sp-field">
                  <span>Qty</span>
                  <input
                    type="number"
                    min="1"
                    value={draftItem.qty}
                    onChange={(e) => handleDraftChange('qty', e.target.value)}
                  />
                </label>
                <label className="sp-field">
                  <span>Unit Price</span>
                  <input
                    type="number"
                    min="0"
                    value={draftItem.unitPrice}
                    onChange={(e) => handleDraftChange('unitPrice', e.target.value)}
                  />
                </label>
                <label className="sp-field">
                  <span>Discount (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={draftItem.discountPercent}
                    onChange={(e) => handleDraftChange('discountPercent', e.target.value)}
                  />
                </label>
                <div className="sp-add-actions">
                  <button type="button" className="sp-btn sp-btn-primary" onClick={handleAddItem}>
                    Add Item
                  </button>
                </div>
              </div>
            </div>

            <div className="sp-table-wrap">
              <div className="sp-table sp-table-head">
                <div>Product</div>
                <div>Item</div>
                <div>Batch</div>
                <div>Qty</div>
                <div>Unit</div>
                <div>Unit Price</div>
                <div>Discount (%)</div>
                <div>Net</div>
                <div>Action</div>
              </div>

              {saleItems.map((item) => {
                const gross = item.qty * item.unitPrice;
                const discountAmount = (gross * item.discountPercent) / 100;
                const net = gross - discountAmount;
                return (
                  <div className="sp-table sp-table-row" key={item.id}>
                    <div className="is-strong">{products.find((product) => product.id === item.productId)?.sku || 'SKU'}</div>
                    <div className="is-strong">{item.name}</div>
                    <div>{item.batch}</div>
                    <div>{item.qty}</div>
                    <div>{item.unit}</div>
                    <div>{money(item.unitPrice)}</div>
                    <div>{item.discountPercent}%</div>
                    <div className="is-strong">{money(net)}</div>
                    <div>
                      <button
                        type="button"
                        className="sp-remove-btn"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="sp-side">
            <div className="sp-card">
              <div className="sp-card-head">
                <h2>Payment Summary</h2>
              </div>

              <div className="sp-summary">
                <div className="sp-summary-row">
                  <span>Subtotal</span>
                  <strong>{money(totals.subtotal)}</strong>
                </div>
                <div className="sp-summary-row">
                  <span>Discount</span>
                  <strong>{money(totals.discount)}</strong>
                </div>
                <div className="sp-summary-row">
                  <span>VAT (3%)</span>
                  <strong>{money(totals.vat)}</strong>
                </div>
                <div className="sp-summary-row sp-total-row">
                  <span>Grand Total</span>
                  <strong>{money(totals.grandTotal)}</strong>
                </div>
                <div className="sp-summary-row">
                  <span>Paid</span>
                  <strong>{money(totals.paid)}</strong>
                </div>
                <div className="sp-summary-row">
                  <span>Due</span>
                  <strong>{money(totals.due)}</strong>
                </div>
              </div>
            </div>

            <div className="sp-card">
              <div className="sp-card-head">
                <h2>Payment Method</h2>
              </div>
              <div className="sp-methods">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`sp-method${method.toLowerCase() === paymentMethod ? ' is-active' : ''}`}
                    onClick={() => setPaymentMethod(method.toLowerCase())}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="sp-card">
              <div className="sp-card-head">
                <h2>Actions</h2>
              </div>
              <div className="sp-actions">
                <button type="button" className="sp-btn sp-btn-primary">Finalize Sale</button>
                <button type="button" className="sp-btn sp-btn-muted">Print Invoice</button>
                <button type="button" className="sp-btn sp-btn-muted">Hold Bill</button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
