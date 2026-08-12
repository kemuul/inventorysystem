// api/searchApi.js
import axiosClient from './axiosClient';

export const searchApi = {
  search: (query) => axiosClient.get(`/search?q=${encodeURIComponent(query)}`)
};
