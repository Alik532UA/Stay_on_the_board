import { io } from 'socket.io-client';

// URL сервера можна винести у env
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket']
});

// Приклад використання:
// import { socket } from '$lib/online/socket';
// socket.connect();
// socket.emit('join-room', roomId);
// socket.on('message', (data) => { ... }); 