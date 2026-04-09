import AxiosInstance from "../components/AxiosInstance";

const STOCK_BASE = "/stock";

const sortProductsByName = (products) =>
  [...products].sort((left, right) =>
    (left.name || "").localeCompare(right.name || "", undefined, {
      sensitivity: "base",
    })
  );

export const stockService = {
  async getProducts(params = {}) {
    const { data } = await AxiosInstance.get(`${STOCK_BASE}/products/`, {
      params,
    });
    return Array.isArray(data) ? sortProductsByName(data) : data;
  },

  async createProduct(payload) {
    const { data } = await AxiosInstance.post(`${STOCK_BASE}/products/`, payload);
    return data;
  },

  async updateProduct(productId, payload) {
    const { data } = await AxiosInstance.patch(`${STOCK_BASE}/products/${productId}/`, payload);
    return data;
  },

  async deleteProduct(productId) {
    await AxiosInstance.delete(`${STOCK_BASE}/products/${productId}/`);
  },

  async importProductPurchases(file) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await AxiosInstance.post(`${STOCK_BASE}/products/purchase-import/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  async getProductPurchaseImportHistory(params = {}) {
    const { data } = await AxiosInstance.get(`${STOCK_BASE}/products/purchase-import/history/`, {
      params,
    });
    return data;
  },

  async getProductPurchaseImportHistoryDetail(importId) {
    const { data } = await AxiosInstance.get(`${STOCK_BASE}/products/purchase-import/history/${importId}/`);
    return data;
  },
};

export default stockService;
