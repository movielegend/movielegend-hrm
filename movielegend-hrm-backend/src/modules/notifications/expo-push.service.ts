import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}) {
    if (!userIds || userIds.length === 0) return;

    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        revokedAt: null,
      },
    });

    if (devices.length === 0) return;

    const messages: ExpoPushMessage[] = [];

    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.tokenHash)) {
        this.logger.warn(`Push token ${device.tokenHash} is not a valid Expo push token`);
        continue;
      }
      
      messages.push({
        to: device.tokenHash,
        sound: 'default',
        title,
        body,
        data,
      });
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Sent push notification chunk: ${JSON.stringify(ticketChunk)}`);
      } catch (error) {
        this.logger.error('Error sending push notifications', error);
      }
    }
  }
}
