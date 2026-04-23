// salesService.js
import AxiosInstance from "../components/AxiosInstance";

const SALES_BASE = '/sales';
const sortProductsByName = (products) =>
  [...products].sort((left, right) =>
    (left.name || "").localeCompare(right.name || "", undefined, {
      sensitivity: "base",
    })
  );

export const salesService = {
  async getProducts(params = {}) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/products/`, {
      params,
    });
    return Array.isArray(data) ? sortProductsByName(data) : data;

  },

  async createProduct(payload) {
    const { data } = await AxiosInstance.post(`${SALES_BASE}/products/`, payload);
    return data;
  },

  async updateProduct(productId, payload) {
    const { data } = await AxiosInstance.patch(`${SALES_BASE}/products/${productId}/`, payload);
    return data;
  },

  async deleteProduct(productId) {
    await AxiosInstance.delete(`${SALES_BASE}/products/${productId}/`);
  },

  async getLatestSale() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/latest/`);
    return data.sale;
  },

  async getDashboardSummary() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/summary/`);
    return data;
  },

  async createSale(payload) {
    const { data } = await AxiosInstance.post(`${SALES_BASE}/invoices/`, payload);
    return data;
  },

  async getInvoices() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/invoices/`);
    return data;
  },

  async getInvoice(invoiceId) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/invoices/${invoiceId}/`);
    return data;
  },

  async updateInvoice(invoiceId, payload) {
    const { data } = await AxiosInstance.patch(`${SALES_BASE}/invoices/${invoiceId}/`, payload);
    return data;
  },

  async getCustomers() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/customers/`);
    return data;
  },

  async createCustomer(payload) {
    const { data } = await AxiosInstance.post(`${SALES_BASE}/customers/create/`, payload);
    return data;
  },

  async searchCustomers(search) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/customers/`, {
      params: search ? { search } : {},
    });
    return data;
  },

  async updateCustomer(customerId, payload) {
    const { data } = await AxiosInstance.patch(`${SALES_BASE}/customers/${customerId}/`, payload);
    return data;
  },

  async deleteCustomer(customerId) {
    await AxiosInstance.delete(`${SALES_BASE}/customers/${customerId}/`);
  },

  // Invoice payments
  async getInvoicePayments(invoiceId) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/invoices/${invoiceId}/payments/`);
    return data;
  },

  async createInvoicePayment(invoiceId, payload) {
    const { data } = await AxiosInstance.post(`${SALES_BASE}/invoices/${invoiceId}/payments/`, payload);
    return data;
  },

  // Sales payments list (for Sales/Payments page)
  async getPayments(params = {}) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/payments/`, { params });
    return data;
  },

  // Customer ledger
  async getCustomerLedger(customerId) {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/customers/${customerId}/ledger/`);
    return data;
  },
};

export default salesService;
