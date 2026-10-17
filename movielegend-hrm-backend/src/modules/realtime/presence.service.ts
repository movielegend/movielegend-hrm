import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from './realtime-events.service';

export interface UserPresenceStatus {
  userId: string;
  isOnline: boolean;
  lastActiveAt: string | null;
}

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  // userId -> Set of connected socketIds (multi-device/multi-tab support)
  private readonly userSockets = new Map<string, Set<string>>();

  // userId -> disconnect grace timer (30s anti-flickering)
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
  ) {}

  /**
   * Handle when a user socket connects or reconnects.
   */
  handleUserConnect(userId: string, socketId: string): void {
    if (!userId) return;

    // 1. If user was in grace period (disconnect timer running), cancel it!
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId)!);
      this.disconnectTimers.delete(userId);
      this.logger.debug(`User ${userId} reconnected within grace period.`);
    }

    // 2. Track new socket
    const existingSockets = this.userSockets.get(userId);
    const wasAlreadyOnline = existingSockets && existingSockets.size > 0;

    if (!existingSockets) {
      this.userSockets.set(userId, new Set([socketId]));
    } else {
      existingSockets.add(socketId);
    }

    // 3. If transitioning from offline to online, broadcast to company room
    if (!wasAlreadyOnline) {
      this.logger.log(`User ${userId} is now ONLINE`);
      this.realtime.emitToRoom('company', 'presence:update', {
        userId,
        isOnline: true,
        lastActiveAt: null,
      });
    }
  }

  /**
   * Handle when a socket disconnects.
   */
  handleUserDisconnect(userId: string, socketId: string): void {
    if (!userId) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);

    // If user has other active sockets (e.g. web tab still open), remain online
    if (sockets.size > 0) {
      return;
    }

    // User has 0 active sockets left. Remove from map and start 30-second grace timer
    this.userSockets.delete(userId);

    // Clear any existing timer just in case
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId)!);
    }

    const timer = setTimeout(async () => {
      this.disconnectTimers.delete(userId);

      // Verify user didn't reconnect during timer
      if (this.isUserOnline(userId)) {
        return;
      }

      const now = new Date();
      this.logger.log(`User ${userId} is now OFFLINE (Grace period ended)`);

      // Persist lastActiveAt to database
      try {
        await this.prisma.user.update({
          where: { id: userId },
          data: { lastActiveAt: now },
        });
      } catch (err) {
        this.logger.warn(`Failed to update lastActiveAt for ${userId}: ${(err as Error).message}`);
      }

      // Broadcast offline status to all clients
      this.realtime.emitToRoom('company', 'presence:update', {
        userId,
        isOnline: false,
        lastActiveAt: now.toISOString(),
      });
    }, 30000); // 30 seconds debounce timer

    this.disconnectTimers.set(userId, timer);
  }

  /**
   * Heartbeat from active mobile/web client.
   */
  handleHeartbeat(userId: string): void {
    if (!userId) return;
    if (this.disconnectTimers.has(userId)) {
      clearTimeout(this.disconnectTimers.get(userId)!);
      this.disconnectTimers.delete(userId);
    }
  }

  /**
   * Check if a specific user is currently online.
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  /**
   * Get all currently online user IDs.
   */
  getAllOnlineUserIds(): string[] {
    const onlineIds: string[] = [];
    for (const [userId, sockets] of this.userSockets.entries()) {
      if (sockets.size > 0) {
        onlineIds.push(userId);
      }
    }
    return onlineIds;
  }

  /**
   * Query presence statuses for a list of user IDs.
   * If online -> isOnline: true
   * If offline -> isOnline: false, lastActiveAt from DB
   */
  async getBatchStatuses(
    userIds: string[],
  ): Promise<Record<string, { isOnline: boolean; lastActiveAt: string | null }>> {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const result: Record<string, { isOnline: boolean; lastActiveAt: string | null }> = {};
    const offlineIds: string[] = [];

    for (const id of uniqueIds) {
      if (this.isUserOnline(id)) {
        result[id] = { isOnline: true, lastActiveAt: null };
      } else {
        offlineIds.push(id);
      }
    }

    if (offlineIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: offlineIds } },
        select: { id: true, lastActiveAt: true },
      });

      const userMap = new Map(users.map((u) => [u.id, u.lastActiveAt]));

      for (const id of offlineIds) {
        const lastActive = userMap.get(id);
        result[id] = {
          isOnline: false,
          lastActiveAt: lastActive ? lastActive.toISOString() : null,
        };
      }
    }

    return result;
  }
}
