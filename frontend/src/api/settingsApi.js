// api/settingsApi.js
import axiosClient from './axiosClient';

export const settingsApi = {
  get: () => axiosClient.get('/settings'),
  update: (payload) => axiosClient.put('/settings', payload)
};
