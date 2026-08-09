// api/productApi.js
import axiosClient from './axiosClient';

export const productApi = {
  getAll: () => axiosClient.get('/products'),
  getById: (id) => axiosClient.get(`/products/${id}`),
  create: (payload) => axiosClient.post('/products', payload),
  update: (id, payload) => axiosClient.put(`/products/${id}`, payload),
  remove: (id) => axiosClient.delete(`/products/${id}`)
};
