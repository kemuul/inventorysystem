// api/profitLossApi.js
import axiosClient from './axiosClient';

export const profitLossApi = {
  getSummary: (period = 'month') => axiosClient.get(`/profit-loss/summary?period=${period}`),
  getTrend: (range = 'week') => axiosClient.get(`/profit-loss/trend?range=${range}`),
  getExpenses: () => axiosClient.get('/profit-loss/expenses'),
  addExpense: (payload) => axiosClient.post('/profit-loss/expenses', payload),
  getLosses: () => axiosClient.get('/profit-loss/losses')
};
