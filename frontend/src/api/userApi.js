// api/userApi.js
import axiosClient from './axiosClient';

export const userApi = {
  getAll: () => axiosClient.get('/users'),
  getById: (id) => axiosClient.get(`/users/${id}`),
  create: (payload) => axiosClient.post('/users', payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  remove: (id) => axiosClient.delete(`/users/${id}`)
};
