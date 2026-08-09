// api/marketValueApi.js
import axiosClient from './axiosClient';

export const marketValueApi = {
  getComparison: () => axiosClient.get('/market-value'),
  getTrend: (productId) => axiosClient.get(`/market-value/${productId}/trend`),
  recordPrice: (productId, payload) => axiosClient.post(`/market-value/${productId}`, payload)
};
