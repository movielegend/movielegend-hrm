import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BirthdayAnnouncementService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BirthdayAnnouncementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeEventsService,
    private readonly notifications: NotificationsService,
  ) {}

  onApplicationBootstrap() {
    // Chạy kiểm tra sau khi ứng dụng khởi động 10s để đảm bảo không bỏ sót sinh nhật hôm nay nếu hệ thống restart
    setTimeout(() => {
      this.checkAndSendBirthdayAnnouncements().catch((err) => {
        this.logger.error('Lỗi khi chạy quét sinh nhật lúc khởi động ứng dụng:', err);
      });
    }, 10000);
  }

  // Chạy tự động vào lúc 08:00 sáng mỗi ngày theo giờ Việt Nam
  @Cron('0 8 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyBirthdayCron() {
    this.logger.log('Bắt đầu quét và thông báo sinh nhật hằng ngày cho các phòng ban...');
    await this.checkAndSendBirthdayAnnouncements();
  }

  /**
   * Quét và gửi thông báo chúc mừng sinh nhật vào nhóm chat nội bộ từng phòng ban
   * @param targetDate Tuỳ chọn ngày kiểm tra (mặc định là hôm nay theo giờ VN)
   */
  async checkAndSendBirthdayAnnouncements(targetDate?: Date): Promise<{
    date: string;
    birthdaysFound: number;
    messagesSent: number;
    details: Array<{ user: string; department: string; groupId: string; status: string }>;
  }> {
    const now = targetDate ?? new Date();

    // Lấy ngày và tháng theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const targetDay = Number(parts.find((p) => p.type === 'day')?.value);
    const targetMonth = Number(parts.find((p) => p.type === 'month')?.value);
    const targetYear = parts.find((p) => p.type === 'year')?.value;
    const todayDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;

    const startOfDay = new Date(`${todayDateStr}T00:00:00+07:00`);
    const endOfDay = new Date(`${todayDateStr}T23:59:59.999+07:00`);

    this.logger.log(`Quét sinh nhật ngày ${todayDateStr} (Ngày ${targetDay}, Tháng ${targetMonth})...`);

    // 1. Tìm tất cả nhân viên đang hoạt động có dateOfBirth
    const activeUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        profile: {
          dateOfBirth: { not: null },
        },
      },
      select: {
        id: true,
        userCode: true,
        profile: {
          select: {
            fullName: true,
            dateOfBirth: true,
            avatarUrl: true,
          },
        },
        departmentLinks: {
          where: { leftAt: null },
          select: {
            department: {
              select: {
                id: true,
                name: true,
                leaderUserId: true,
              },
            },
          },
        },
      },
    });

    // 2. Lọc những người có sinh nhật trùng ngày hôm nay
    const birthdayUsers = activeUsers.filter((u) => {
      const dob = u.profile?.dateOfBirth;
      if (!dob) return false;

      // So sánh theo giờ VN
      const dobVNParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: 'numeric',
        month: 'numeric',
      }).formatToParts(dob);
      const dobVNDay = Number(dobVNParts.find((p) => p.type === 'day')?.value);
      const dobVNMonth = Number(dobVNParts.find((p) => p.type === 'month')?.value);

      // So sánh theo UTC
      const dobUtcDay = dob.getUTCDate();
      const dobUtcMonth = dob.getUTCMonth() + 1;

      return (
        (dobVNDay === targetDay && dobVNMonth === targetMonth) ||
        (dobUtcDay === targetDay && dobUtcMonth === targetMonth)
      );
    });

    this.logger.log(`Tìm thấy ${birthdayUsers.length} nhân viên có sinh nhật ngày ${todayDateStr}`);

    const details: Array<{ user: string; department: string; groupId: string; status: string }> = [];
    let messagesSent = 0;

    // Tìm tài khoản gửi tin nhắn (ưu tiên NV000001 - Admin Movie Legend)
    const adminUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { userCode: 'NV000001' },
          { roles: { some: { role: { code: 'ADMIN' } } } },
        ],
        isActive: true,
      },
      orderBy: { userCode: 'asc' },
      select: { id: true, userCode: true },
    });

    for (const birthdayUser of birthdayUsers) {
      const empName = birthdayUser.profile?.fullName?.trim() || birthdayUser.userCode;

      // Danh sách các phòng ban của nhân viên này
      const departments: Array<{ id: string; name: string; leaderUserId: string | null }> = [
        ...birthdayUser.departmentLinks.map((d) => d.department),
      ];

      // Nếu nhân viên là trưởng phòng của phòng ban nào đó mà chưa có trong danh sách
      const ledDepts = await this.prisma.department.findMany({
        where: { leaderUserId: birthdayUser.id },
        select: { id: true, name: true, leaderUserId: true },
      });
      for (const ld of ledDepts) {
        if (!departments.some((d) => d.id === ld.id)) {
          departments.push(ld);
        }
      }

      if (departments.length === 0) {
        details.push({
          user: empName,
          department: 'Không thuộc phòng ban nào',
          groupId: '',
          status: 'SKIPPED_NO_DEPARTMENT',
        });
        continue;
      }

      for (const dept of departments) {
        // Lấy hoặc tạo nhóm chat nội bộ phòng ban
        const group = await this.prisma.chatGroup.upsert({
          where: { departmentId: dept.id },
          create: {
            departmentId: dept.id,
            name: `Nhóm ${dept.name}`,
            type: 'DEPARTMENT',
          },
          update: {},
        });

        // Kiểm tra xem hôm nay đã gửi lời chúc mừng sinh nhật cho người này trong nhóm chưa
        const nowUTC = new Date();
        const startOfToday = new Date(nowUTC.getFullYear(), nowUTC.getMonth(), nowUTC.getDate());
        const existing = await this.prisma.chatMessage.findFirst({
          where: {
            groupId: group.id,
            createdAt: {
              gte: targetDate ? startOfToday : startOfDay,
              lte: targetDate ? new Date() : endOfDay,
            },
            mentions: { has: birthdayUser.id },
            content: { contains: 'sinh nhật' },
          },
        });

        if (existing) {
          details.push({
            user: empName,
            department: dept.name,
            groupId: group.id,
            status: 'ALREADY_SENT_TODAY',
          });
          continue;
        }

        // Chọn người gửi tin nhắn: Admin hoặc Trưởng phòng (nếu khác người sinh nhật)
        let senderId = adminUser?.id;
        if (!senderId && dept.leaderUserId && dept.leaderUserId !== birthdayUser.id) {
          senderId = dept.leaderUserId;
        }
        if (!senderId) {
          senderId = birthdayUser.id;
        }

        // Nội dung lời chúc mừng sinh nhật Zalo-style thân thiện
        const content = `🎂🎉 CHÚC MỪNG SINH NHẬT! 🎉🎂\n\nHôm nay là sinh nhật của @${empName}! 🎈\nThay mặt đại gia đình ${dept.name}, chúc bạn bước sang tuổi mới luôn dồi dào sức khỏe, ngập tràn niềm vui, hạnh phúc và gặt hái thật nhiều thành công rực rỡ! 🎁🍰✨\n\nCả nhà cùng gửi những lời chúc tốt đẹp nhất đến @${empName} nhé! 🥳💖`;

        const message = await this.prisma.chatMessage.create({
          data: {
            groupId: group.id,
            senderId,
            content,
            mentions: [birthdayUser.id],
          },
          include: {
            sender: {
              select: {
                id: true,
                userCode: true,
                roles: { include: { role: true } },
                profile: { select: { fullName: true, avatarUrl: true } },
              },
            },
          },
        });

        // Cập nhật updatedAt của nhóm chat
        await this.prisma.chatGroup.update({
          where: { id: group.id },
          data: { updatedAt: new Date() },
        }).catch(() => {});

        // Phát tín hiệu Realtime qua WebSocket
        this.realtime.emitToRoom(`group:${group.id}`, 'chat:message', message);
        this.realtime.emitToRoom('company', 'chat:group_updated', {
          groupId: group.id,
          latestMessage: message,
        });

        if (dept.id) {
          this.realtime.emitToDepartment(dept.id, 'chat:message', message);
        }

        // Gửi thông báo đến từng thành viên trong phòng ban
        const deptMembers = await this.prisma.departmentMember.findMany({
          where: { departmentId: dept.id, leftAt: null },
          select: { userId: true },
        });

        for (const dm of deptMembers) {
          this.realtime.emitToUser(dm.userId, 'chat:message', message);
        }

        // Tạo thông báo in-app
        const notifyUserIds = deptMembers.map((m) => m.userId);
        if (notifyUserIds.length > 0) {
          this.prisma.$transaction(async (tx) => {
            const payload = await this.notifications.createForUsers(
              tx as any,
              notifyUserIds,
              {
                type: 'CHAT_MESSAGE',
                title: `Nhóm ${dept.name}`,
                body: `🎂 Hôm nay là sinh nhật của ${empName}! Hãy gửi lời chúc mừng nhé! 🎉`,
                metadata: {
                  groupId: group.id,
                  messageId: message.id,
                  groupName: group.name || `Nhóm ${dept.name}`,
                  groupType: group.type,
                  senderId,
                  senderName: 'Admin',
                  isBirthday: true,
                  birthdayUserId: birthdayUser.id,
                },
              },
            );
            if (payload) {
              this.notifications.emitCreated(payload);
            }
          }).catch((err) => {
            this.logger.error('Lỗi khi tạo thông báo in-app cho sinh nhật:', err);
          });
        }

        messagesSent++;
        details.push({
          user: empName,
          department: dept.name,
          groupId: group.id,
          status: 'SENT',
        });
      }
    }

    return {
      date: todayDateStr,
      birthdaysFound: birthdayUsers.length,
      messagesSent,
      details,
    };
  }
}
