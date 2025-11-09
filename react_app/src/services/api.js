import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally for Laravel Echo
window.Pusher = Pusher;

const API_BASE_URL = 'http://localhost:80/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize Laravel Echo for WebSocket connections
export const echo = new Echo({
  broadcaster: 'reverb',
  key: '8hlc5bhzgdhjhjwvol15',
  wsHost: 'localhost',
  wsPort: 8080,
  wssPort: 8080,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

export const dashboardAPI = {
  getKpiStats: () => api.get('/kpi-stats').then(res => res.data),
  getAppointments: () => api.get('/appointments').then(res => res.data),
  getActionQueue: () => api.get('/action-queue').then(res => res.data),
  getActionLog: () => api.get('/action-log').then(res => res.data),
  processAppointments: () => api.post('/process-appointments').then(res => res.data),
  resetAppointments: () => api.post('/reset-appointments').then(res => res.data),
  confirmAppointment: (id) => api.post(`/appointments/${id}/confirm`).then(res => res.data),
  skipAppointment: (id) => api.post(`/appointments/${id}/skip`).then(res => res.data),
};

export default api;
