/**
 * trafficSocket.js
 * Singleton Socket.io client for real-time traffic simulation.
 */
import { io } from 'socket.io-client';

const getSocketURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace('/api/v1', '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5050';
    }
  }
  return 'https://scms-1-kplt.onrender.com';
};

const SOCKET_URL = getSocketURL();

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[TrafficSocket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[TrafficSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[TrafficSocket] Connection error:', err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, disconnectSocket };
