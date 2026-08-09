// api/stockApi.js
import axiosClient from './axiosClient';

export const stockApi = {
  getAll: () => axiosClient.get('/stocks'),
  restock: (productId, payload) => axiosClient.post(`/stocks/${productId}/restock`, payload),
  adjust: (productId, payload) => axiosClient.post(`/stocks/${productId}/adjust`, payload),
  getHistory: (productId) => axiosClient.get(`/stocks/${productId}/history`)
};
