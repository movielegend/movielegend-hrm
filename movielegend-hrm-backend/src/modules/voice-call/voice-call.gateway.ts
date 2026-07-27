import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceCallService } from './voice-call.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: '/hrm' })
export class VoiceCallGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly voiceCallService: VoiceCallService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private extractUserId(client: Socket): string {
    return client.data?.userId;
  }

  @SubscribeMessage('voice_call:request')
  async handleCallRequest(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string }) {
    const callerId = this.extractUserId(client);
    if (!callerId || !payload.targetUserId) return { ok: false, code: 'INVALID_PARAMETERS' };
    
    // Notify target user
    this.server.to(`user:${payload.targetUserId}`).emit('voice_call:incoming', { callerId });
    return { ok: true };
  }

  @SubscribeMessage('voice_call:accept')
  async handleCallAccept(@ConnectedSocket() client: Socket, @MessageBody() payload: { callerId: string }) {
    const receiverId = this.extractUserId(client);
    if (!receiverId || !payload.callerId) return { ok: false, code: 'INVALID_PARAMETERS' };

    const roomName = `call_${payload.callerId}_${receiverId}_${Date.now()}`;

    try {
      // Generate tokens for both
      const callerToken = await this.voiceCallService.generateToken(roomName, `User ${payload.callerId}`, payload.callerId);
      const receiverToken = await this.voiceCallService.generateToken(roomName, `User ${receiverId}`, receiverId);

      // Send token back to receiver (who accepted)
      client.emit('voice_call:token', { token: receiverToken, roomName });

      // Send token to caller
      this.server.to(`user:${payload.callerId}`).emit('voice_call:accepted', { token: callerToken, roomName, receiverId });
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
  }

  @SubscribeMessage('voice_call:reject')
  handleCallReject(@ConnectedSocket() client: Socket, @MessageBody() payload: { callerId: string }) {
    const receiverId = this.extractUserId(client);
    if (!receiverId || !payload.callerId) return { ok: false };
    
    this.server.to(`user:${payload.callerId}`).emit('voice_call:rejected', { receiverId });
    return { ok: true };
  }

  @SubscribeMessage('voice_call:end')
  handleCallEnd(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string }) {
    const userId = this.extractUserId(client);
    if (!userId || !payload.targetUserId) return { ok: false };
    
    this.server.to(`user:${payload.targetUserId}`).emit('voice_call:ended', { userId });
    return { ok: true };
  }
}
