import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VoiceCallService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async getCallerInfo(userId: string): Promise<{ fullName: string; avatarUrl: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { fullName: true, avatarUrl: true } } },
    });
    return {
      fullName: user?.profile?.fullName ?? 'Người dùng',
      avatarUrl: user?.profile?.avatarUrl ?? null,
    };
  }

  async generateToken(roomName: string, participantName: string, participantId: string): Promise<string> {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new InternalServerErrorException('LiveKit API Key or Secret is not configured');
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantName,
    });
    
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    return await at.toJwt();
  }
}
