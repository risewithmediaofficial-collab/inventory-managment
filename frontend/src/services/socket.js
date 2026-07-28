import { io } from 'socket.io-client';
import { store } from '../store/index.js';

let socket = null;

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:5000`;
    }
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  return 'http://localhost:5000';
};

export const initSocket = () => {
  const token = store.getState().auth?.accessToken;
  if (!token || socket?.connected) return socket;

  const url = getSocketUrl();

  socket = io(url, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 3000,
    timeout: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToEvent = (event, callback) => {
  if (!socket) return () => {};
  socket.on(event, callback);
  return () => socket.off(event, callback);
};

export const emitEvent = (event, data) => {
  if (socket?.connected) {
    socket.emit(event, data);
  }
};
