import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class VoiceCallService {
  constructor(private configService: ConfigService) {}

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
