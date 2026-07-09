import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { RoleScopeType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { RealtimeEventsService } from './realtime-events.service';

@Injectable()
@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: '/hrm' })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  afterInit(): void {
    this.realtime.bind((room, event, payload) => this.server.to(room).emit(event, payload));
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        roles?: string[];
        scopes?: Array<{ role?: string; scopeType?: RoleScopeType; scopeId?: string }>;
      }>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
      client.data.userId = payload.sub;
      client.data.roles = payload.roles ?? [];
      client.data.scopes = payload.scopes ?? [];
      client.join(`user:${payload.sub}`);
      for (const scope of payload.scopes ?? []) {
        if (scope.scopeId) client.join(`department:${scope.scopeId}`);
      }
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('warehouse:join')
  handleWarehouseJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { warehouseId?: string }) {
    const warehouseId = payload?.warehouseId;
    if (!warehouseId) return { ok: false, code: 'WAREHOUSE_ID_REQUIRED' };
    const roles = (client.data.roles ?? []) as string[];
    const scopes = (client.data.scopes ?? []) as Array<{ role?: string; scopeType?: RoleScopeType; scopeId?: string }>;
    const allowed =
      roles.includes('ADMIN') ||
      scopes.some(
        (scope) =>
          scope.role === 'WAREHOUSE_MANAGER' &&
          scope.scopeType === RoleScopeType.WAREHOUSE &&
          scope.scopeId === warehouseId,
      );
    if (!allowed) return { ok: false, code: 'FORBIDDEN_WAREHOUSE_ROOM' };
    client.join(`warehouse:${warehouseId}`);
    return { ok: true };
  }

  @SubscribeMessage('chat:join')
  handleChatJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { departmentId?: string }) {
    const departmentId = payload?.departmentId;
    if (!departmentId) return { ok: false, code: 'DEPARTMENT_ID_REQUIRED' };
    // TODO: Verify if user belongs to this department before joining
    client.join(`department:${departmentId}`);
    return { ok: true };
  }

  private extractToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken) return authToken.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header) return header.replace(/^Bearer\s+/i, '');
    throw new Error('Missing token');
  }
}
