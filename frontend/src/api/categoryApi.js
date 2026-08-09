// api/categoryApi.js
import axiosClient from './axiosClient';

export const categoryApi = {
  getAll: () => axiosClient.get('/categories'),
  getById: (id) => axiosClient.get(`/categories/${id}`),
  create: (payload) => axiosClient.post('/categories', payload),
  update: (id, payload) => axiosClient.put(`/categories/${id}`, payload),
  remove: (id) => axiosClient.delete(`/categories/${id}`)
};
