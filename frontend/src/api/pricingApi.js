// api/pricingApi.js
import axiosClient from './axiosClient';

export const pricingApi = {
  getAll: () => axiosClient.get('/pricing'),
  getHistory: (productId) => axiosClient.get(`/pricing/${productId}/history`),
  updatePrice: (productId, payload) => axiosClient.put(`/pricing/${productId}`, payload)
};
