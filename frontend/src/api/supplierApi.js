// api/supplierApi.js
import axiosClient from './axiosClient';

export const supplierApi = {
  getAll: () => axiosClient.get('/suppliers'),
  getById: (id) => axiosClient.get(`/suppliers/${id}`),
  create: (payload) => axiosClient.post('/suppliers', payload),
  update: (id, payload) => axiosClient.put(`/suppliers/${id}`, payload),
  remove: (id) => axiosClient.delete(`/suppliers/${id}`)
};
