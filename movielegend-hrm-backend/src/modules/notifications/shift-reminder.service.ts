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

  // Run every 5 minutes
  @Cron('*/5 * * * *')
  async checkUpcomingShifts() {
    this.logger.log('Checking for upcoming shifts to send reminders...');
    
    const now = new Date();
    // Look ahead 10 minutes
    const future = new Date(now.getTime() + 10 * 60000);
    
    // We would need to query shift assignments for the current day
    // And parse the start time to see if it's within the next 10 mins.
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

    const usersToRemindCheckin: string[] = [];
    const usersToRemindCheckout: string[] = [];

    for (const assignment of upcomingAssignments) {
      if (!assignment.shift) continue;
      
      const attendance = await this.prisma.attendanceRecord.findUnique({
        where: {
          userId_workDate: {
            userId: assignment.userId,
            workDate: assignment.workDate
          }
        }
      });
      
      // 1. Check-in reminder
      if (assignment.shift.startTime) {
        // Parse shift start time (e.g., "08:00")
        const [hours, minutes] = assignment.shift.startTime.split(':').map(Number);
        
        const shiftStartTime = new Date(assignment.workDate);
        shiftStartTime.setHours(hours, minutes, 0, 0);

        // If the shift starts between now and the next 10 minutes
        if (shiftStartTime > now && shiftStartTime <= future) {
          if (!attendance || !attendance.checkInAt) {
            usersToRemindCheckin.push(assignment.userId);
          }
        }
      }

      // 2. Check-out reminder
      if (assignment.shift.endTime) {
        const [hours, minutes] = assignment.shift.endTime.split(':').map(Number);
        
        const shiftEndTime = new Date(assignment.workDate);
        shiftEndTime.setHours(hours, minutes, 0, 0);

        // If the shift ends between now and the next 10 minutes
        if (shiftEndTime > now && shiftEndTime <= future) {
          // If they have checked in, but not checked out yet
          if (attendance && attendance.checkInAt && !attendance.checkOutAt) {
            usersToRemindCheckout.push(assignment.userId);
          }
        }
      }
    }

    if (usersToRemindCheckin.length > 0) {
      this.logger.log(`Sending check-in reminder to ${usersToRemindCheckin.length} users`);
      await this.expoPush.sendPushNotification(
        usersToRemindCheckin,
        'Sắp đến giờ làm việc',
        'Ca làm việc của bạn sắp bắt đầu, đừng quên mở app để check-in nhé!'
      );
    }

    if (usersToRemindCheckout.length > 0) {
      this.logger.log(`Sending check-out reminder to ${usersToRemindCheckout.length} users`);
      await this.expoPush.sendPushNotification(
        usersToRemindCheckout,
        'Sắp hết giờ làm việc',
        'Ca làm việc của bạn sắp kết thúc, đừng quên mở app để check-out nhé!'
      );
    }
  }

  // Run every 5 minutes to check task deadlines
  @Cron('*/5 * * * *')
  async checkUpcomingTasks() {
    this.logger.log('Checking for upcoming task deadlines to send reminders...');
    
    const now = new Date();
    // Look ahead 10 minutes
    const future = new Date(now.getTime() + 10 * 60000);
    
    // Find task assignments that are due within the next 10 minutes
    // and are not yet completed/submitted.
    const upcomingAssignments = await this.prisma.taskAssignment.findMany({
      where: {
        OR: [
          {
            assignmentDueAt: { gt: now, lte: future }
          },
          {
            assignmentDueAt: null,
            task: {
              dueAt: { gt: now, lte: future }
            }
          }
        ],
        status: {
          notIn: ['COMPLETED', 'CANCELLED', 'WAITING_REVIEW']
        },
        task: {
          status: {
            notIn: ['COMPLETED', 'CANCELLED', 'DRAFT']
          }
        }
      },
      include: {
        task: true
      }
    });

    if (upcomingAssignments.length > 0) {
      this.logger.log(`Found ${upcomingAssignments.length} upcoming task assignments. Sending reminders...`);
      
      for (const assignment of upcomingAssignments) {
        await this.expoPush.sendPushNotification(
          [assignment.userId],
          'Sắp đến hạn công việc',
          `Công việc "${assignment.task.title}" sắp đến hạn. Vui lòng hoàn thành trước deadline!`,
          { type: 'TASK_UPDATED', taskId: assignment.taskId }
        );
      }
    }
  }
}
