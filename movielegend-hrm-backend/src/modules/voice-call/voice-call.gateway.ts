import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceCallService } from './voice-call.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExpoPushService } from '../notifications/expo-push.service';
import { ChatService } from '../chat/chat.service';

interface CallSession {
  callId: string;
  callerId: string;
  targetUserId: string;
  roomName?: string;
  status: 'RINGING' | 'ACTIVE' | 'ENDED';
  createdAt: number;
  acceptedAt?: number;
  timeoutHandle?: NodeJS.Timeout;
}

@WebSocketGateway({ 
  cors: { origin: true, credentials: true }, 
  namespace: '/hrm',
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class VoiceCallGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Active call sessions indexed by callId
  private activeSessions = new Map<string, CallSession>();
  // Maps userId -> callId (tracks whether a user is currently in a call/ringing)
  private userCallMap = new Map<string, string>();

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

  handleDisconnect(client: Socket) {
    const userId = this.extractUserId(client);
    if (!userId) return;

    const callId = this.userCallMap.get(userId);
    if (callId) {
      const session = this.activeSessions.get(callId);
      if (session) {
        const peerId = session.callerId === userId ? session.targetUserId : session.callerId;
        this.cleanupSession(callId);
        this.server.to(`user:${peerId}`).emit('voice_call:ended', { userId, reason: 'PEER_DISCONNECTED' });
      }
    }
  }

  private cleanupSession(callId: string) {
    const session = this.activeSessions.get(callId);
    if (session) {
      if (session.timeoutHandle) {
        clearTimeout(session.timeoutHandle);
      }
      session.status = 'ENDED';
      this.userCallMap.delete(session.callerId);
      this.userCallMap.delete(session.targetUserId);
      this.activeSessions.delete(callId);
    }
  }

  private handleCallTimeout(callId: string) {
    const session = this.activeSessions.get(callId);
    if (!session || session.status !== 'RINGING') return;

    this.cleanupSession(callId);

    // Notify both sides call timed out
    this.server.to(`user:${session.callerId}`).emit('voice_call:ended', { userId: session.targetUserId, reason: 'TIMEOUT' });
    this.server.to(`user:${session.targetUserId}`).emit('voice_call:ended', { userId: session.callerId, reason: 'TIMEOUT' });

    // Log missed call
    this.chatService.createDirectChat(session.callerId, session.targetUserId).then((group) => {
      this.chatService.sendMessage({ userId: session.callerId, roles: [] } as any, group.id, {
        content: '📞 Cuộc gọi thoại nhỡ',
      });
    }).catch((e) => console.error('Failed to log timeout missed call', e));
  }

  @SubscribeMessage('voice_call:request')
  async handleCallRequest(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string }) {
    try {
      const callerId = this.extractUserId(client);
      if (!callerId || !payload.targetUserId) {
        console.log('VoiceCall request rejected: missing callerId or targetUserId', { callerId, targetUserId: payload.targetUserId });
        return { ok: false, code: 'INVALID_PARAMETERS' };
      }

      if (callerId === payload.targetUserId) {
        return { ok: false, code: 'CANNOT_CALL_SELF', message: 'Không thể tự gọi cho chính mình' };
      }

      // Check if caller is already in an active call
      if (this.userCallMap.has(callerId)) {
        const existingCallId = this.userCallMap.get(callerId);
        const existing = existingCallId ? this.activeSessions.get(existingCallId) : null;
        if (existing && existing.status !== 'ENDED') {
          return { ok: false, code: 'ALREADY_IN_CALL', message: 'Bạn đang trong một cuộc gọi khác' };
        } else {
          this.userCallMap.delete(callerId);
        }
      }

      // Check if target user is currently in another call or receiving a call
      if (this.userCallMap.has(payload.targetUserId)) {
        const existingCallId = this.userCallMap.get(payload.targetUserId);
        const existing = existingCallId ? this.activeSessions.get(existingCallId) : null;
        if (existing && existing.status !== 'ENDED') {
          // Target user is BUSY
          client.emit('voice_call:rejected', { receiverId: payload.targetUserId, reason: 'BUSY' });
          return { ok: false, code: 'TARGET_BUSY', message: 'Người nhận hiện đang bận (trong cuộc gọi khác)' };
        } else {
          this.userCallMap.delete(payload.targetUserId);
        }
      }

      // Create new call session
      const callId = `call_${callerId}_${payload.targetUserId}_${Date.now()}`;
      const session: CallSession = {
        callId,
        callerId,
        targetUserId: payload.targetUserId,
        status: 'RINGING',
        createdAt: Date.now(),
        timeoutHandle: setTimeout(() => {
          this.handleCallTimeout(callId);
        }, 45000),
      };

      this.activeSessions.set(callId, session);
      this.userCallMap.set(callerId, callId);
      this.userCallMap.set(payload.targetUserId, callId);
      
      // Get caller info (name + avatar) from DB
      const callerInfo = await this.voiceCallService.getCallerInfo(callerId);

      // Notify target user via socket
      this.server.to(`user:${payload.targetUserId}`).emit('voice_call:incoming', {
        callId,
        callerId,
        callerName: callerInfo.fullName,
        callerAvatar: callerInfo.avatarUrl,
        createdAt: session.createdAt,
      });

      // Also send push notification (for when app is killed/backgrounded)
      this.expoPush.sendPushNotification(
        [payload.targetUserId],
        'Cuộc gọi đến',
        `${callerInfo.fullName} đang gọi cho bạn`,
        {
          type: 'VOICE_CALL_INCOMING',
          callId,
          callerId,
          callerName: callerInfo.fullName,
          callerAvatar: callerInfo.avatarUrl,
          createdAt: session.createdAt,
        },
        {
          categoryId: 'VOICE_CALL_INCOMING',
          priority: 'high',
          channelId: 'incoming_calls_v4',
          sound: 'ringtone.wav',
        }
      ).catch(e => console.error('Failed to send call push notification', e));

      return { ok: true, callId };
    } catch (e) {
      console.error('Error in handleCallRequest:', e);
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
  }

  @SubscribeMessage('voice_call:accept')
  async handleCallAccept(@ConnectedSocket() client: Socket, @MessageBody() payload: { callerId: string; callId?: string }) {
    const receiverId = this.extractUserId(client);
    if (!receiverId || !payload.callerId) return { ok: false, code: 'INVALID_PARAMETERS' };

    // Find active ringing session
    let session: CallSession | undefined;
    if (payload.callId) {
      session = this.activeSessions.get(payload.callId);
    }
    if (!session) {
      const userCallId = this.userCallMap.get(receiverId);
      if (userCallId) {
        session = this.activeSessions.get(userCallId);
      }
    }

    // Verify session validity
    if (!session || session.status !== 'RINGING' || session.callerId !== payload.callerId || session.targetUserId !== receiverId) {
      console.log('Call accept rejected - session expired or non-existent', { sessionStatus: session?.status, payload });
      client.emit('voice_call:ended', { message: 'Cuộc gọi đã kết thúc hoặc không tồn tại' });
      return { ok: false, code: 'CALL_EXPIRED', message: 'Cuộc gọi đã kết thúc hoặc không tồn tại' };
    }

    // Clear timeout and transition to ACTIVE
    if (session.timeoutHandle) {
      clearTimeout(session.timeoutHandle);
      session.timeoutHandle = undefined;
    }
    session.status = 'ACTIVE';
    session.acceptedAt = Date.now();
    const roomName = `room_${session.callId}`;
    session.roomName = roomName;

    try {
      // Generate tokens for both
      const callerToken = await this.voiceCallService.generateToken(roomName, `User ${payload.callerId}`, payload.callerId);
      const receiverToken = await this.voiceCallService.generateToken(roomName, `User ${receiverId}`, receiverId);

      // Send token back to receiver (who accepted)
      client.emit('voice_call:token', { token: receiverToken, roomName, callId: session.callId });

      // Notify other devices of receiver to stop ringing
      client.broadcast.to(`user:${receiverId}`).emit('voice_call:handled_elsewhere', { callerId: payload.callerId, callId: session.callId });

      // Send token to caller
      this.server.to(`user:${payload.callerId}`).emit('voice_call:accepted', { token: callerToken, roomName, receiverId, callId: session.callId });
      return { ok: true };
    } catch (error) {
      console.error('Error generating LiveKit tokens on call accept:', error);
      this.cleanupSession(session.callId);
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
  }

  @SubscribeMessage('voice_call:reject')
  async handleCallReject(@ConnectedSocket() client: Socket, @MessageBody() payload: { callerId: string; callId?: string; reason?: string }) {
    const receiverId = this.extractUserId(client);
    if (!receiverId || !payload.callerId) return { ok: false };

    let session: CallSession | undefined;
    if (payload.callId) {
      session = this.activeSessions.get(payload.callId);
    }
    if (!session) {
      const userCallId = this.userCallMap.get(receiverId);
      if (userCallId) {
        session = this.activeSessions.get(userCallId);
      }
    }

    if (session) {
      this.cleanupSession(session.callId);
    } else {
      this.userCallMap.delete(receiverId);
    }
    
    this.server.to(`user:${payload.callerId}`).emit('voice_call:rejected', { receiverId, reason: payload.reason || 'REJECTED' });

    // Notify other devices of receiver to stop ringing
    client.broadcast.to(`user:${receiverId}`).emit('voice_call:handled_elsewhere', { callerId: payload.callerId });

    if (payload.reason !== 'BUSY') {
      // Log missed call history to chat
      try {
        const group = await this.chatService.createDirectChat(payload.callerId, receiverId);
        await this.chatService.sendMessage({ userId: payload.callerId, roles: [] } as any, group.id, {
          content: '📞 Cuộc gọi thoại nhỡ',
        });
      } catch (e) {
        console.error('Failed to log missed call to chat', e);
      }
    }

    return { ok: true };
  }

  @SubscribeMessage('voice_call:end')
  async handleCallEnd(@ConnectedSocket() client: Socket, @MessageBody() payload: { targetUserId: string; callId?: string; duration?: number }) {
    const userId = this.extractUserId(client);
    if (!userId || !payload.targetUserId) return { ok: false };

    let session: CallSession | undefined;
    if (payload.callId) {
      session = this.activeSessions.get(payload.callId);
    }
    if (!session) {
      const userCallId = this.userCallMap.get(userId);
      if (userCallId) {
        session = this.activeSessions.get(userCallId);
      }
    }

    if (session) {
      this.cleanupSession(session.callId);
    } else {
      this.userCallMap.delete(userId);
      this.userCallMap.delete(payload.targetUserId);
    }
    
    this.server.to(`user:${payload.targetUserId}`).emit('voice_call:ended', { userId });

    // Log call duration to chat
    try {
      const group = await this.chatService.createDirectChat(userId, payload.targetUserId);
      let content = '📞 Cuộc gọi thoại';
      if (payload.duration !== undefined && payload.duration > 0) {
        const m = Math.floor(payload.duration / 60);
        const s = payload.duration % 60;
        const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        content = `📞 Cuộc gọi thoại (${formatted})`;
      } else {
        content = '📞 Cuộc gọi thoại nhỡ';
      }
      
      await this.chatService.sendMessage({ userId, roles: [] } as any, group.id, {
        content,
      });
    } catch (e) {
      console.error('Failed to log call duration to chat', e);
    }

    return { ok: true };
  }
}

