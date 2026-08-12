// api/reportsApi.js
import axiosClient from './axiosClient';

export const reportsApi = {
  getSalesReport: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return axiosClient.get(`/reports/sales${qs ? `?${qs}` : ''}`);
  },
  getInventoryReport: () => axiosClient.get('/reports/inventory')
};
