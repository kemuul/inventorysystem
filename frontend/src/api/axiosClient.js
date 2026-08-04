// api/axiosClient.js
// One shared axios instance — base URL comes from Vite env so it's easy to
// point at a different backend per environment (dev/staging/prod).
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Unwrap { success, data } responses so components just get `data` back.
axiosClient.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
