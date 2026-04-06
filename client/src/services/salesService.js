// salesService.js
import AxiosInstance from "../components/AxiosInstance";

const SALES_BASE = '/sales';

export const salesService = {
  async getProducts() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/products/`);
    return data;

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

  async getCustomers() {
    const { data } = await AxiosInstance.get(`${SALES_BASE}/customers/`);
    return data;
  },

  async createCustomer(payload) {
    const { data } = await AxiosInstance.post(`${SALES_BASE}/customers/create/`, payload);
    return data;
  },
};

export default salesService;