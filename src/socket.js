import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_SOCKET_URL || 'https://oditechteams-backend.onrender.com';

export const socket = io(URL, {
  autoConnect: false, // We connect manually after login
});
