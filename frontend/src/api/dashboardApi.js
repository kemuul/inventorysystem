// api/dashboardApi.js
import axiosClient from './axiosClient';

export const dashboardApi = {
  getSummary: () => axiosClient.get('/dashboard/summary'),
  getProfitLossTrend: (range = 'week') => axiosClient.get(`/dashboard/profit-loss?range=${range}`),
  getTopSelling: (limit = 5) => axiosClient.get(`/dashboard/top-selling?limit=${limit}`),
  getLowStockAlerts: () => axiosClient.get('/dashboard/low-stock'),
  getInsights: () => axiosClient.get('/dashboard/insights')
};
