import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../../database/prisma.service';

function cleanNotificationText(str?: string): string {
  if (!str) return str || '';
  return str
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async sendPushNotification(userIds: string[], title: string, body: string, data: any = {}, options?: { categoryId?: string; priority?: 'default' | 'normal' | 'high'; channelId?: string; sound?: string }) {
    if (!userIds || userIds.length === 0) return;

    const cleanTitle = cleanNotificationText(title);
    const cleanBody = cleanNotificationText(body);

    const devices = await this.prisma.deviceToken.findMany({
      where: {
        userId: { in: userIds },
        revokedAt: null,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    if (devices.length === 0) {
      this.logger.warn(`No active device tokens found for users: [${userIds.join(', ')}]. Push notification skipped.`);
      return;
    }

    const messages: ExpoPushMessage[] = [];
    const seenTokens = new Set<string>();
    const seenUserPlatforms = new Set<string>();

    for (const device of devices) {
      if (!Expo.isExpoPushToken(device.token)) {
        this.logger.warn(`Push token ${device.token} for user ${device.userId} is not a valid Expo push token`);
        continue;
      }

      // 1. Prevent duplicate pushes to the same token
      if (seenTokens.has(device.token)) {
        continue;
      }

      // 2. Strict deduplication: Only send to the single newest active token per user per platform
      // Since devices is sorted by lastSeenAt DESC, the first encountered is always the newest active device token.
      const userPlatformKey = `${device.userId}:${String(device.platform || 'ANDROID').toUpperCase()}`;
      if (seenUserPlatforms.has(userPlatformKey)) {
        // Automatically revoke older duplicate token in DB to prevent future clutter
        this.prisma.deviceToken.updateMany({
          where: {
            userId: device.userId,
            token: device.token,
            revokedAt: null,
          },
          data: { revokedAt: new Date() },
        }).catch(() => {});
        continue;
      }

      seenUserPlatforms.add(userPlatformKey);
      seenTokens.add(device.token);
      
      messages.push({
        to: device.token,
        sound: options?.sound ? (options.sound as any) : 'default',
        title: cleanTitle,
        body: cleanBody,
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
                const tokenList = Array.isArray(invalidToken) ? invalidToken : [invalidToken];
                this.prisma.deviceToken.updateMany({
                  where: { token: { in: tokenList } },
                  data: { revokedAt: new Date() },
                }).catch(e => this.logger.error(`Failed to auto-revoke invalid token: ${JSON.stringify(invalidToken)}`, e));
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
