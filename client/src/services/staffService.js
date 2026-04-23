import AxiosInstance from '../components/AxiosInstance';

const BASE = '/staff';

const staffService = {
  async list(params = {}) {
    const { data } = await AxiosInstance.get(`${BASE}/`, { params });
    return data;
  },

  async get(id) {
    const { data } = await AxiosInstance.get(`${BASE}/${id}/`);
    return data;
  },

  async create(payload) {
    const { data } = await AxiosInstance.post(`${BASE}/`, payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await AxiosInstance.patch(`${BASE}/${id}/`, payload);
    return data;
  },

  async deactivate(id) {
    const { data } = await AxiosInstance.delete(`${BASE}/${id}/`);
    return data;
  },

  async activate(id) {
    const { data } = await AxiosInstance.post(`${BASE}/${id}/activate/`);
    return data;
  },

  async changePassword(id, payload) {
    const { data } = await AxiosInstance.post(`${BASE}/${id}/change-password/`, payload);
    return data;
  },
};

export default staffService;
