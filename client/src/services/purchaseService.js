import AxiosInstance from "../components/AxiosInstance";

const PURCHASE_BASE = "/purchase";

export const purchaseService = {
  async getPurchases(params = {}) {
    const { data } = await AxiosInstance.get(`${PURCHASE_BASE}/entries/`, { params });
    return data;
  },

  async getPurchaseDetail(purchaseId) {
    const { data } = await AxiosInstance.get(`${PURCHASE_BASE}/entries/${purchaseId}/`);
    return data;
  },

  async createManualPurchase(payload) {
    const { data } = await AxiosInstance.post(`${PURCHASE_BASE}/entries/manual/`, payload);
    return data;
  },

  async importPurchaseExcel(file) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await AxiosInstance.post(`${PURCHASE_BASE}/entries/import/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};

export default purchaseService;
