import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}, options?: { categoryId?: string; priority?: 'default' | 'normal' | 'high'; channelId?: string; sound?: string }) {
    if (!userIds || userIds.length === 0) return;

    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        revokedAt: null,
      },
    });

    if (devices.length === 0) {
      this.logger.warn(`No active device tokens found for users: [${userIds.join(', ')}]. Push notification skipped.`);
      return;
    }

    const messages: ExpoPushMessage[] = [];

    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.token)) {
        this.logger.warn(`Push token ${device.token} for user ${device.userId} is not a valid Expo push token`);
        continue;
      }
      
      messages.push({
        to: device.token,
        sound: options?.sound ? (options.sound as any) : 'default',
        title,
        body,
        data,
        categoryId: options?.categoryId,
        priority: options?.priority || 'high',
        channelId: options?.channelId || 'default',
      });
    }

    if (messages.length === 0) {
      this.logger.warn(`No valid Expo push messages to send for users: [${userIds.join(', ')}]`);
      return;
    }

    const chunks = this.expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        this.logger.log(`Sent push notification chunk (${ticketChunk.length} tickets): ${JSON.stringify(ticketChunk)}`);

        // Check for errors in tickets
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          if (ticket.status === 'error') {
            this.logger.error(`Error sending push notification to token: ${chunk[i]?.to}. Error: ${ticket.message} (${ticket.details?.error})`);
            if (ticket.details?.error === 'DeviceNotRegistered') {
              const invalidToken = chunk[i]?.to;
              if (invalidToken) {
                this.prisma.deviceToken.updateMany({
                  where: { token: invalidToken },
                  data: { revokedAt: new Date() },
                }).catch(e => this.logger.error(`Failed to auto-revoke invalid token: ${invalidToken}`, e));
              }
            }
          }
        }
      } catch (error: any) {
        if (error.code === 'PUSH_TOO_MANY_EXPERIENCE_IDS') {
           this.logger.warn('Multiple experience IDs found, falling back to individual sending');
           for (const msg of chunk) {
              try {
                await this.expo.sendPushNotificationsAsync([msg]);
              } catch (e) {
                this.logger.error(`Error sending individual push:`, e);
              }
           }
        } else {
           this.logger.error('Error sending push notifications', error);
        }
      }
    }
  }
}
