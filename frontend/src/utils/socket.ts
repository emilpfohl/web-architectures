import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3000`;

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ['websocket', 'polling']
});
