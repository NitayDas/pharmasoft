import api from './authService';

const SALES_API_BASE = 'http://localhost:8000/api/sales';

export const salesService = {
  async getProducts() {
    const { data } = await api.get(`${SALES_API_BASE}/products/`);
    return data;
  },

  async getLatestSale() {
    const { data } = await api.get(`${SALES_API_BASE}/latest/`);
    return data.sale;
  },

  async getDashboardSummary() {
    const { data } = await api.get(`${SALES_API_BASE}/summary/`);
    return data;
  },

  async createSale(payload) {
    const { data } = await api.post(`${SALES_API_BASE}/invoices/`, payload);
    return data;
  },

  async getCustomers() {
    const { data } = await api.get(`${SALES_API_BASE}/customers/`);
    return data;
  },

  async createCustomer(payload) {
    const { data } = await api.post(`${SALES_API_BASE}/customers/create/`, payload);
    return data;
  },
};

export default salesService;
