import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { assertSocketUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';

export async function createHrmSocket(): Promise<Socket> {
  const token = await getAccessToken();
  const options: Partial<ManagerOptions & SocketOptions> = {
    transports: ['websocket', 'polling'], // Direct WebSocket for instant 0.01s latency
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 3000,
    timeout: 10000,
    ...(token ? { auth: { token } } : {}),
  };
  return io(`${assertSocketUrl()}/hrm`, options);
}
