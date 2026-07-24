import { io } from 'socket.io-client';
import { store } from '../store/index.js';

let socket = null;

export const initSocket = () => {
  const token = store.getState().auth?.accessToken;
  if (!token || socket?.connected) return socket;

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
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
