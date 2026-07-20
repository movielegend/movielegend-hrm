import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ExpoPushService } from './expo-push.service';

@Injectable()
export class ShiftReminderService {
  private readonly logger = new Logger(ShiftReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expoPush: ExpoPushService,
  ) {}

  // Run every 15 minutes
  @Cron('*/15 * * * *')
  async checkUpcomingShifts() {
    this.logger.log('Checking for upcoming shifts to send reminders...');
    
    const now = new Date();
    // Look ahead 30 minutes
    const future = new Date(now.getTime() + 30 * 60000);
    
    // We would need to query shift assignments for the current day
    // And parse the start time to see if it's within the next 30 mins.
    // For simplicity, we query assignments where workDate is today.
    
    const todayStr = future.toISOString().split('T')[0];
    const todayStart = new Date(todayStr + 'T00:00:00Z');
    const todayEnd = new Date(todayStr + 'T23:59:59Z');

    const upcomingAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        workDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: 'ASSIGNED'
      },
      include: {
        shift: true,
        user: true,
      }
    });

    const usersToRemind: string[] = [];

    for (const assignment of upcomingAssignments) {
      if (!assignment.shift || !assignment.shift.startTime) continue;
      
      // Parse shift start time (e.g., "08:00")
      const [hours, minutes] = assignment.shift.startTime.split(':').map(Number);
      
      const shiftStartTime = new Date(assignment.workDate);
      shiftStartTime.setHours(hours, minutes, 0, 0);

      // If the shift starts between now and the next 30 minutes
      if (shiftStartTime > now && shiftStartTime <= future) {
        
        // Check if user already checked in
        const attendance = await this.prisma.attendanceRecord.findUnique({
          where: {
            userId_workDate: {
              userId: assignment.userId,
              workDate: assignment.workDate
            }
          }
        });

        if (!attendance) {
          usersToRemind.push(assignment.userId);
        }
      }
    }

    if (usersToRemind.length > 0) {
      this.logger.log(`Sending check-in reminder to ${usersToRemind.length} users`);
      await this.expoPush.sendPushNotification(
        usersToRemind,
        'Sắp đến giờ làm việc',
        'Ca làm việc của bạn sắp bắt đầu, đừng quên mở app để check-in nhé!'
      );
    }
  }
}
