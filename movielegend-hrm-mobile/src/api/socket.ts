import { io, type ManagerOptions, type Socket, type SocketOptions } from 'socket.io-client';
import { assertSocketUrl } from '../constants/env';
import { getAccessToken } from '../storage/secure-token.storage';

export async function createHrmSocket(): Promise<Socket> {
  const token = await getAccessToken();
  const options: Partial<ManagerOptions & SocketOptions> = {
    transports: ['websocket'],
    autoConnect: false,
    ...(token ? { auth: { token } } : {}),
  };
  return io(`${assertSocketUrl()}/hrm`, options);
}
