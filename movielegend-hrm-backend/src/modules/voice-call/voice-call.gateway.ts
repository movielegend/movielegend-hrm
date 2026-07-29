import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceCallService } from './voice-call.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExpoPushService } from '../notifications/expo-push.service';
import { ChatService } from '../chat/chat.service';

@WebSocketGateway({ cors: { origin: true, credentials: true }, namespace: '/hrm' })
export class VoiceCallGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly voiceCallService: VoiceCallService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly expoPush: ExpoPushService,
    private readonly chatService: ChatService,
  ) {}

  private extractUserId(client: Socket): string | undefined {
    if (client.data?.userId) return client.data.userId;
    try {
      const authToken = client.handshake.auth?.token || client.handshake.headers.authorization;
      if (typeof authToken === 'string' && authToken) {
        const token = authToken.replace(/^Bearer\s+/i, '');
        const payload = this.jwt.decode(token) as any;
        return payload?.sub;
      }
    } catch (e) {
      console.warn('Failed to extract token in VoiceCallGateway', e);
    }
    return undefined;
  }

  @SubscribeMessage('voice_call:request')
  async handleCallRequest(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string }) {
    try {
      const callerId = this.extractUserId(client);
      if (!callerId || !payload.targetUserId) {
        console.log('VoiceCall request rejected: missing callerId or targetUserId', { callerId, targetUserId: payload.targetUserId });
        return { ok: false, code: 'INVALID_PARAMETERS' };
      }
      
      // Get caller info (name + avatar) from DB
      const callerInfo = await this.voiceCallService.getCallerInfo(callerId);

      // Notify target user via socket
      this.server.to(`user:${payload.targetUserId}`).emit('voice_call:incoming', {
        callerId,
        callerName: callerInfo.fullName,
        callerAvatar: callerInfo.avatarUrl,
      });

      // Also send push notification (for when app is killed/backgrounded)
      this.expoPush.sendPushNotification(
        [payload.targetUserId],
        'Cuộc gọi đến',
        `${callerInfo.fullName} đang gọi cho bạn`,
        {
          type: 'VOICE_CALL_INCOMING',
          callerId,
          callerName: callerInfo.fullName,
          callerAvatar: callerInfo.avatarUrl,
        },
        {
          categoryId: 'VOICE_CALL_INCOMING',
          priority: 'high',
          channelId: 'incoming_calls_v3',
          sound: 'ringtone.wav',
        }
      ).catch(e => console.error('Failed to send call push notification', e));

      return { ok: true };
    } catch (e) {
      console.error('Error in handleCallRequest:', e);
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
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

      // Notify other devices of receiver to stop ringing
      client.broadcast.to(`user:${receiverId}`).emit('voice_call:handled_elsewhere', { callerId: payload.callerId });

      // Send token to caller
      this.server.to(`user:${payload.callerId}`).emit('voice_call:accepted', { token: callerToken, roomName, receiverId });
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
  }

  @SubscribeMessage('voice_call:reject')
  async handleCallReject(@ConnectedSocket() client: Socket, @MessageBody() payload: { callerId: string }) {
    const receiverId = this.extractUserId(client);
    if (!receiverId || !payload.callerId) return { ok: false };
    
    this.server.to(`user:${payload.callerId}`).emit('voice_call:rejected', { receiverId });

    // Notify other devices of receiver to stop ringing
    client.broadcast.to(`user:${receiverId}`).emit('voice_call:handled_elsewhere', { callerId: payload.callerId });

    // Log missed call history to chat
    try {
      const group = await this.chatService.createDirectChat(payload.callerId, receiverId);
      await this.chatService.sendMessage(payload.callerId, group.id, {
        content: '📞 Cuộc gọi thoại nhỡ',
      });
    } catch (e) {
      console.error('Failed to log missed call to chat', e);
    }

    return { ok: true };
  }

  @SubscribeMessage('voice_call:end')
  async handleCallEnd(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string, duration?: number }) {
    const userId = this.extractUserId(client);
    if (!userId || !payload.targetUserId) return { ok: false };
    
    this.server.to(`user:${payload.targetUserId}`).emit('voice_call:ended', { userId });

    // Log call duration to chat
    try {
      const group = await this.chatService.createDirectChat(userId, payload.targetUserId);
      let content = '📞 Cuộc gọi thoại';
      if (payload.duration !== undefined) {
        const m = Math.floor(payload.duration / 60);
        const s = payload.duration % 60;
        const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        content = `📞 Cuộc gọi thoại (${formatted})`;
      } else {
         content = '📞 Cuộc gọi thoại nhỡ';
      }
      
      await this.chatService.sendMessage(userId, group.id, {
        content,
      });
    } catch (e) {
      console.error('Failed to log call duration to chat', e);
    }

    return { ok: true };
  }
}
