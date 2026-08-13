// api/salesApi.js
import axiosClient from './axiosClient';

export const salesApi = {
  getAll: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return axiosClient.get(`/sales${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => axiosClient.get(`/sales/${id}`),
  // payload: { customer_name?, items: [{ product_id, quantity }] }
  create: (payload) => axiosClient.post('/sales', payload)
};
