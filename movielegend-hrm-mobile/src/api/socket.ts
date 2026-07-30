import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { assertSocketUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';

export async function createHrmSocket(): Promise<Socket> {
  const token = await getAccessToken();
  const options: Partial<ManagerOptions & SocketOptions> = {
    transports: ['polling', 'websocket'], // Use polling first to ensure custom headers are sent correctly over ngrok
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    extraHeaders: {
      'ngrok-skip-browser-warning': 'true',
    },
    ...(token ? { auth: { token } } : {}),
  };
  return io(`${assertSocketUrl()}/hrm`, options);
}
