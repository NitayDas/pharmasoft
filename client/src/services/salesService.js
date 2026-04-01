import api from './authService';

export const salesService = {
  async getProducts() {
    const { data } = await api.get('/products/');
    return data;
  },

  async getLatestSale() {
    const { data } = await api.get('/latest/');
    return data.sale;
  },

  async getDashboardSummary() {
    const { data } = await api.get('/summary/');
    return data;
  },

  async createSale(payload) {
    const { data } = await api.post('/invoices/', payload);
    return data;
  },
};

export default salesService;
