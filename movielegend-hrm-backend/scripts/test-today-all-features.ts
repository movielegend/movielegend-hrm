import 'dotenv/config';
import { PrismaService } from '../src/database/prisma.service';
import { DepartmentScopeService } from '../src/modules/phase2-policy/department-scope.service';
import { BusinessTimeService } from '../src/modules/time/business-time.service';
import { EmployeeRequestsService } from '../src/modules/employee-requests/employee-requests.service';
import { EmployeeRequestType, EmployeeRequestStatus } from '@prisma/client';
import moment from 'moment-timezone';

async function runTodayAutomatedTests() {
  console.log('======================================================================');
  console.log('🚀 BẮT ĐẦU CHẠY KIỂM THỬ TỰ ĐỘNG CÁC CHỨC NĂNG MỚI (14/10/2026)');
  console.log('   Bao gồm: Luồng Mua Hàng Doanh Nghiệp (HR Banking, Loopback, Fulfill)');
  console.log('   và Quy tắc Báo trước Đơn Xin Nghỉ (3h, 24h, 72h)');
  console.log('======================================================================\n');

  const prisma = new PrismaService();
  await prisma.$connect();
  const scope = new DepartmentScopeService(prisma);
  const businessTime = new BusinessTimeService();

  const notificationsSent: any[] = [];
  const mockNotifications: any = {
    create: async (dto: any) => {
      notificationsSent.push(dto);
      return { id: 'mock-notif-id', ...dto };
    },
    createForUsers: async (tx: any, userIds: string[], dto: any) => {
      notificationsSent.push({ type: 'createForUsers', userIds, dto });
      return { id: 'mock-notif-id', ...dto };
    },
    createForDepartment: async (tx: any, deptId: string, dto: any) => {
      notificationsSent.push({ type: 'createForDepartment', deptId, dto });
      return { id: 'mock-notif-id', ...dto };
    },
    emitCreated: (notif: any) => {
      notificationsSent.push({ type: 'emitCreated', notif });
    },
    sendToUsers: async (...args: any[]) => {
      notificationsSent.push({ type: 'sendToUsers', args });
    },
    sendToDepartment: async (...args: any[]) => {
      notificationsSent.push({ type: 'sendToDepartment', args });
    },
    notifyAccountantsOnHrEvent: async (...args: any[]) => {
      notificationsSent.push({ type: 'notifyAccountantsOnHrEvent', args });
    },
  };

  const requestsService = new EmployeeRequestsService(prisma, scope, businessTime, mockNotifications);

  const testResults: { id: string; name: string; status: 'PASS' | 'FAIL'; detail?: string }[] = [];
  const createdRequestIds: string[] = [];

  try {
    // 1. TÌM TÀI KHOẢN TEST
    console.log('🔍 [SETUP] Đang tìm kiếm các tài khoản vai trò trong hệ thống...');

    const memberWithLeader = await prisma.departmentMember.findFirst({
      where: {
        department: {
          code: { notIn: ['KT', 'KETOAN', 'HR', 'HCNS'] },
          leaderUserId: { not: null },
        },
        user: {
          roles: { none: { role: { code: { in: ['LEADER', 'ADMIN', 'ACCOUNTANT_LEAD', 'DIRECTOR'] } } } },
        },
      },
      include: {
        user: { include: { profile: true } },
        department: {
          include: {
            leader: { include: { profile: true } },
          },
        },
      },
    });

    const ktDept = await prisma.department.findFirst({
      where: {
        OR: [
          { code: { in: ['KT', 'KETOAN'] } },
          { name: { contains: 'KẾ TOÁN', mode: 'insensitive' } },
        ],
      },
      include: {
        leader: { include: { profile: true } },
        members: { include: { user: { include: { profile: true } } } },
      },
    });

    const hrDept = await prisma.department.findFirst({
      where: {
        OR: [
          { code: { in: ['HR', 'HCNS'] } },
          { name: { contains: 'NHÂN SỰ', mode: 'insensitive' } },
        ],
      },
      include: {
        leader: { include: { profile: true } },
        members: { include: { user: { include: { profile: true } } } },
      },
    });

    const adminUser = await prisma.user.findFirst({
      where: {
        roles: { some: { role: { code: 'ADMIN' } } },
      },
      include: { profile: true },
    });

    if (!memberWithLeader?.department?.leader || !ktDept?.leader || !adminUser) {
      throw new Error('Thiếu dữ liệu tài khoản nền tảng để chạy test');
    }

    const requesterUser = memberWithLeader.user;
    const leaderUser = memberWithLeader.department.leader;
    const ktLeaderUser = ktDept.leader;
    const hrUser = hrDept?.members[0]?.user || hrDept?.leader || requesterUser;

    const requesterActor: any = {
      userId: requesterUser.id,
      userCode: requesterUser.userCode,
      sub: requesterUser.id,
      roles: ['EMPLOYEE'],
      scopes: [],
      permissions: [],
      isDirector: false,
    };
    const leaderActor: any = {
      userId: leaderUser.id,
      userCode: leaderUser.userCode,
      sub: leaderUser.id,
      roles: ['LEADER'],
      scopes: [],
      permissions: [],
      isDirector: false,
    };
    const ktLeaderActor: any = {
      userId: ktLeaderUser.id,
      userCode: ktLeaderUser.userCode,
      sub: ktLeaderUser.id,
      roles: ['LEADER', 'ACCOUNTANT_LEAD', 'ACCOUNTANT'],
      scopes: [],
      permissions: [],
      isDirector: false,
    };
    const hrActor: any = {
      userId: hrUser.id,
      userCode: hrUser.userCode,
      sub: hrUser.id,
      roles: ['HR'],
      scopes: [],
      permissions: [],
      isDirector: false,
    };
    const adminActor: any = {
      userId: adminUser.id,
      userCode: adminUser.userCode,
      sub: adminUser.id,
      roles: ['ADMIN'],
      scopes: [],
      permissions: [],
      isDirector: true,
    };

    console.log(`✅ Nhân viên đề xuất: ${requesterUser.profile?.fullName} (${requesterUser.userCode})`);
    console.log(`✅ Leader phòng ban: ${leaderUser.profile?.fullName}`);
    console.log(`✅ Kế toán trưởng: ${ktLeaderUser.profile?.fullName}`);
    console.log(`✅ Nhân sự HR: ${hrUser.profile?.fullName}`);
    console.log(`✅ Ban Giám Đốc/Admin: ${adminUser.profile?.fullName}\n`);

    // =========================================================================
    // KHỐI 1: LUỒNG ĐỀ XUẤT MUA SẮM DOANH NGHIỆP (ENTERPRISE PROCUREMENT)
    // =========================================================================
    console.log('----------------------------------------------------------------------');
    console.log('📦 BẮT ĐẦU TEST KHỐI 1: LUỒNG MUA HÀNG DOANH NGHIỆP (ENTERPRISE PURCHASE)');
    console.log('----------------------------------------------------------------------');

    let purchaseId = '';

    // TC-PUR-01: Nhân viên tạo đơn Mua Hàng
    try {
      console.log('👉 [TC-PUR-01] Nhân viên tạo đơn đề xuất mua sắm thiết bị...');
      const req = await requestsService.create(
        {
          type: EmployeeRequestType.PURCHASE,
          title: 'Đề xuất mua sắm: Màn hình đồ họa LG 32 inch 4K',
          content: 'Phục vụ dựng video và thiết kế đồ họa sự kiện',
          amount: 15000000,
          attachmentMetadata: {
            itemName: 'Màn hình đồ họa LG 32 inch 4K',
            quantity: '1 cái',
            neededDate: moment().add(3, 'days').format('DD/MM/YYYY'),
            quoteUrls: ['https://example.com/bao-gia-lg-32.pdf'],
          },
        } as any,
        requesterActor,
      );
      purchaseId = req.id;
      createdRequestIds.push(purchaseId);

      const meta: any = req.attachmentMetadata || {};
      if (req.type === EmployeeRequestType.PURCHASE && meta.stage === 'PENDING_LEADER') {
        testResults.push({ id: 'TC-PUR-01', name: 'Nhân viên tạo đơn mua sắm thành công (khởi tạo stage: PENDING_LEADER)', status: 'PASS' });
      } else {
        throw new Error(`Stage ban đầu không đúng: ${meta.stage}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-01', name: 'Nhân viên tạo đơn mua sắm', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-02: Leader phòng ban duyệt đơn -> chuyển sang PENDING_HR
    try {
      console.log('👉 [TC-PUR-02] Leader duyệt đơn -> Phải chuyển sang stage PENDING_HR...');
      const res = await requestsService.approve(purchaseId, leaderActor, { note: 'Leader xác nhận phòng ban có nhu cầu thực tế, chuyển HR' });
      const meta: any = res.attachmentMetadata || {};
      if (meta.stage === 'PENDING_HR') {
        testResults.push({ id: 'TC-PUR-02', name: 'Leader duyệt đơn mua hàng -> Chuyển thành công sang PENDING_HR để HR đối chứng', status: 'PASS' });
      } else {
        throw new Error(`Stage sau Leader duyệt không phải PENDING_HR: ${meta.stage}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-02', name: 'Leader duyệt đơn mua hàng chuyển HR', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-03: HR duyệt nhưng thiếu STK ngân hàng -> Phải bị chặn
    try {
      console.log('👉 [TC-PUR-03] Kiểm tra chặn nếu HR không cung cấp thông tin tài khoản ngân hàng nhận tiền...');
      let blocked = false;
      try {
        await requestsService.approve(purchaseId, hrActor, { bankAccount: '', bankName: '' });
      } catch (err: any) {
        if (err.status === 400 || err.message?.includes('HR_BANK_INFO_REQUIRED') || err.message?.includes('Số tài khoản')) {
          blocked = true;
        }
      }
      if (blocked) {
        testResults.push({ id: 'TC-PUR-03', name: 'HR duyệt bắt buộc cung cấp STK & Tên ngân hàng nhận giải ngân (Chặn 400 Bad Request nếu thiếu)', status: 'PASS' });
      } else {
        throw new Error('Hệ thống không chặn khi HR thiếu STK ngân hàng');
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-03', name: 'Kiểm tra ràng buộc HR Banking info', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-04: HR cung cấp STK & Duyệt -> Chuyển sang PENDING_ACCOUNTANT
    try {
      console.log('👉 [TC-PUR-04] HR cung cấp STK ngân hàng & duyệt báo giá...');
      const res = await requestsService.approve(purchaseId, hrActor, {
        bankAccount: '1903456789012',
        bankName: 'Techcombank',
        accountHolder: 'NGUYEN THI HR',
        adjustedAmount: 14800000,
        note: 'HR đã đối chứng 3 báo giá, chọn bên uy tín giá 14.800.000đ',
      });
      const meta: any = res.attachmentMetadata || {};
      if (meta.stage === 'PENDING_ACCOUNTANT' && meta.hrBank?.bankAccount === '1903456789012' && Number(res.amount) === 14800000) {
        testResults.push({ id: 'TC-PUR-04', name: 'HR nhập STK ngân hàng, điều chỉnh số tiền duyệt -> Chuyển thành công sang PENDING_ACCOUNTANT', status: 'PASS' });
      } else {
        throw new Error(`HR duyệt thất bại: stage=${meta.stage}, amount=${res.amount}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-04', name: 'HR duyệt & gửi Kế toán', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-05: Kế toán từ chối -> Kích hoạt LOOPBACK chuyển về REJECTED_TO_HR (đơn KHÔNG bị hủy)
    try {
      console.log('👉 [TC-PUR-05] Kế toán từ chối -> Kích hoạt Loopback trả về REJECTED_TO_HR...');
      const res = await requestsService.reject(purchaseId, ktLeaderActor, {
        reason: 'Giá 14.8tr vẫn cao hơn ngân sách dự kiến, yêu cầu HR đàm phán thêm hoặc tìm NCC khác',
      });
      const meta: any = res.attachmentMetadata || {};
      if (res.status === EmployeeRequestStatus.PENDING && meta.stage === 'REJECTED_TO_HR') {
        testResults.push({ id: 'TC-PUR-05', name: 'Loopback thành công: Kế toán từ chối -> Đơn trả về stage REJECTED_TO_HR, giữ nguyên trạng thái PENDING', status: 'PASS' });
      } else {
        throw new Error(`Loopback không đúng: status=${res.status}, stage=${meta.stage}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-05', name: 'Loopback trả về HR khi Kế toán từ chối', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-06: HR cập nhật lại báo giá & Trình lại (resubmitPurchaseByHr) -> Quay lại PENDING_ACCOUNTANT
    try {
      console.log('👉 [TC-PUR-06] HR cập nhật báo giá ưu đãi và Trình lại cho Kế toán...');
      const res = await requestsService.resubmitPurchaseByHr(
        purchaseId,
        {
          amount: 14200000,
          bankAccount: '1903456789012',
          bankName: 'Techcombank',
          accountHolder: 'NGUYEN THI HR',
          explanation: 'Đã đàm phán giảm thêm 600k, giá chốt 14.200.000đ',
          quoteUrls: ['https://example.com/bao-gia-da-chiet-khau.pdf'],
        },
        hrActor,
      );
      const meta: any = res.attachmentMetadata || {};
      if (meta.stage === 'PENDING_ACCOUNTANT' && Number(res.amount) === 14200000) {
        testResults.push({ id: 'TC-PUR-06', name: 'HR trình lại (resubmitPurchaseByHr) -> Cập nhật giá mới và quay lại PENDING_ACCOUNTANT thành công', status: 'PASS' });
      } else {
        throw new Error(`Trình lại thất bại: stage=${meta.stage}, amount=${res.amount}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-06', name: 'HR trình lại cho Kế toán sau khi bị từ chối', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-07: Kế toán trưởng duyệt & Giải ngân tiền cho HR (DISBURSED_TO_HR) -> Chuyển PENDING_HR_PURCHASE
    try {
      console.log('👉 [TC-PUR-07] Kế toán trưởng duyệt & giải ngân tiền cho HR...');
      const res = await requestsService.approve(purchaseId, ktLeaderActor, {
        bankRefCode: 'FT261014998877',
        disbursementProofUrl: 'https://example.com/unc-giai-ngan-14tr2.jpg',
        note: 'Đã chuyển 14.200.000đ vào STK Techcombank của HR',
      });
      const meta: any = res.attachmentMetadata || {};
      if (meta.stage === 'PENDING_HR_PURCHASE' && meta.purchaseApproved === true && meta.bankRefCode === 'FT261014998877') {
        testResults.push({ id: 'TC-PUR-07', name: 'Kế toán trưởng duyệt & giải ngân kèm mã UNC -> Chuyển sang PENDING_HR_PURCHASE để HR đi mua', status: 'PASS' });
      } else {
        throw new Error(`Kế toán giải ngân thất bại: stage=${meta.stage}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-07', name: 'Kế toán giải ngân tiền mua hàng cho HR', status: 'FAIL', detail: e.message });
    }

    // TC-PUR-08: HR hoàn tất mua hàng & bàn giao (fulfillPurchaseByHr) -> Chuyển APPROVED, stage PURCHASE_FULFILLED
    try {
      console.log('👉 [TC-PUR-08] HR đi mua hàng, tải hóa đơn/biên bản bàn giao và bấm Hoàn tất...');
      const res = await requestsService.fulfillPurchaseByHr(
        purchaseId,
        {
          actualAmount: 14200000,
          receiptUrls: ['https://example.com/hoa-don-vat-lg-32.jpg'],
          deliveryProofUrls: ['https://example.com/bien-ban-ban-giao-thiet-bi.jpg'],
          note: 'HR đã mua hàng, kiểm tra tem niêm phong và bàn giao tại phòng livestream',
        },
        hrActor,
      );
      const meta: any = res.attachmentMetadata || {};
      if (res.status === EmployeeRequestStatus.APPROVED && meta.stage === 'PURCHASE_FULFILLED' && meta.fulfillment?.receiptUrls?.length > 0) {
        testResults.push({ id: 'TC-PUR-08', name: 'HR hoàn tất mua sắm & bàn giao (fulfillPurchaseByHr) -> Đơn đạt APPROVED và stage PURCHASE_FULFILLED', status: 'PASS' });
      } else {
        throw new Error(`Hoàn tất mua sắm thất bại: status=${res.status}, stage=${meta.stage}`);
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-PUR-08', name: 'HR hoàn tất mua sắm & bàn giao', status: 'FAIL', detail: e.message });
    }

    // =========================================================================
    // KHỐI 2: QUY TẮC BÁO TRƯỚC ĐƠN XIN NGHỈ PHÉP (LEAVE ADVANCE NOTICE)
    // =========================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('⏰ BẮT ĐẦU TEST KHỐI 2: QUY TẮC THỜI HẠN BÁO TRƯỚC ĐƠN XIN NGHỈ');
    console.log('----------------------------------------------------------------------');

    // TC-LEA-01: Nghỉ theo giờ dưới 3 tiếng -> BỊ CHẶN
    try {
      console.log('👉 [TC-LEA-01] Thử tạo đơn nghỉ theo giờ cách hiện tại 1.5 tiếng...');
      let blocked = false;
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start1 = now.clone().add(1.5, 'hours');
      const end1 = now.clone().add(3.5, 'hours');

      try {
        await requestsService.create(
          {
            type: EmployeeRequestType.LEAVE,
            title: 'Xin nghỉ theo giờ gấp',
            content: 'Có việc riêng',
            attachmentMetadata: {
              leaveDurationType: 'Theo giờ',
              fromDate: start1.toISOString(),
              toDate: end1.toISOString(),
              startTime: start1.toISOString(),
              endTime: end1.toISOString(),
              totalHours: 2,
            },
          } as any,
          requesterActor,
        );
      } catch (err: any) {
        if (err.status === 400 || err.message?.includes('ít nhất 3 tiếng') || err.message?.includes('LEAVE_HOURLY_ADVANCE_NOTICE_REQUIRED')) {
          blocked = true;
        }
      }

      if (blocked) {
        testResults.push({ id: 'TC-LEA-01', name: 'Chặn đơn nghỉ theo giờ nếu báo trước < 3 tiếng (Báo lỗi 400 Bad Request)', status: 'PASS' });
      } else {
        throw new Error('Hệ thống không chặn đơn nghỉ theo giờ tạo gấp < 3 tiếng');
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-01', name: 'Ràng buộc nghỉ theo giờ < 3 tiếng', status: 'FAIL', detail: e.message });
    }

    // TC-LEA-02: Nghỉ theo giờ trên 3 tiếng -> THÀNH CÔNG
    try {
      console.log('👉 [TC-LEA-02] Thử tạo đơn nghỉ theo giờ cách hiện tại 4 tiếng...');
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start2 = now.clone().add(4, 'hours');
      const end2 = now.clone().add(6, 'hours');

      const req = await requestsService.create(
        {
          type: EmployeeRequestType.LEAVE,
          title: 'Xin nghỉ theo giờ hợp lệ (báo trước 4 tiếng)',
          content: 'Khám bệnh định kỳ',
          attachmentMetadata: {
            leaveDurationType: 'Theo giờ',
            fromDate: start2.toISOString(),
            toDate: end2.toISOString(),
            startTime: start2.toISOString(),
            endTime: end2.toISOString(),
            totalHours: 2,
          },
        } as any,
        requesterActor,
      );
      createdRequestIds.push(req.id);
      testResults.push({ id: 'TC-LEA-02', name: 'Cho phép tạo đơn nghỉ theo giờ khi báo trước >= 3 tiếng thành công', status: 'PASS' });
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-02', name: 'Tạo đơn nghỉ theo giờ hợp lệ >= 3 tiếng', status: 'FAIL', detail: e.message });
    }

    // TC-LEA-03: Nghỉ 1 ngày dưới 24 tiếng -> BỊ CHẶN
    try {
      console.log('👉 [TC-LEA-03] Thử tạo đơn nghỉ 1 ngày cách hiện tại 12 tiếng...');
      let blocked = false;
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start3 = now.clone().add(12, 'hours').startOf('day').add(8, 'hours');
      const end3 = start3.clone().add(9, 'hours');

      try {
        await requestsService.create(
          {
            type: EmployeeRequestType.LEAVE,
            title: 'Xin nghỉ 1 ngày gấp',
            content: 'Việc gia đình',
            attachmentMetadata: {
              leaveDurationType: 'Trong ngày',
              fromDate: start3.toISOString(),
              toDate: end3.toISOString(),
              totalDays: 1,
            },
          } as any,
          requesterActor,
        );
      } catch (err: any) {
        if (err.status === 400 || err.message?.includes('ít nhất 24 tiếng') || err.message?.includes('LEAVE_SINGLE_DAY_ADVANCE_NOTICE_REQUIRED')) {
          blocked = true;
        }
      }

      if (blocked) {
        testResults.push({ id: 'TC-LEA-03', name: 'Chặn đơn nghỉ 1 ngày nếu báo trước < 24 tiếng (Báo lỗi 400 Bad Request)', status: 'PASS' });
      } else {
        throw new Error('Hệ thống không chặn đơn nghỉ 1 ngày tạo gấp < 24 tiếng');
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-03', name: 'Ràng buộc nghỉ 1 ngày < 24 tiếng', status: 'FAIL', detail: e.message });
    }

    // TC-LEA-04: Nghỉ 1 ngày trên 24 tiếng -> THÀNH CÔNG
    try {
      console.log('👉 [TC-LEA-04] Thử tạo đơn nghỉ 1 ngày cách hiện tại 2 ngày (>= 24 tiếng)...');
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start4 = now.clone().add(2, 'days').startOf('day').add(8, 'hours');
      const end4 = start4.clone().add(9, 'hours');

      const req = await requestsService.create(
        {
          type: EmployeeRequestType.LEAVE,
          title: 'Xin nghỉ 1 ngày hợp lệ (báo trước > 24 tiếng)',
          content: 'Nghỉ phép năm',
          attachmentMetadata: {
            leaveDurationType: 'Trong ngày',
            fromDate: start4.toISOString(),
            toDate: end4.toISOString(),
            totalDays: 1,
          },
        } as any,
        requesterActor,
      );
      createdRequestIds.push(req.id);
      testResults.push({ id: 'TC-LEA-04', name: 'Cho phép tạo đơn nghỉ 1 ngày khi báo trước >= 24 tiếng thành công', status: 'PASS' });
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-04', name: 'Tạo đơn nghỉ 1 ngày hợp lệ >= 24 tiếng', status: 'FAIL', detail: e.message });
    }

    // TC-LEA-05: Nghỉ từ 2 ngày trở lên dưới 72 tiếng -> BỊ CHẶN
    try {
      console.log('👉 [TC-LEA-05] Thử tạo đơn nghỉ 3 ngày nhưng chỉ báo trước 36 tiếng...');
      let blocked = false;
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start5 = now.clone().add(36, 'hours').startOf('day').add(8, 'hours');
      const end5 = start5.clone().add(2, 'days').add(9, 'hours');

      try {
        await requestsService.create(
          {
            type: EmployeeRequestType.LEAVE,
            title: 'Xin nghỉ 3 ngày đi du lịch',
            content: 'Nghỉ dài ngày',
            attachmentMetadata: {
              leaveDurationType: 'Nhiều ngày',
              fromDate: start5.toISOString(),
              toDate: end5.toISOString(),
              totalDays: 3,
            },
          } as any,
          requesterActor,
        );
      } catch (err: any) {
        if (err.status === 400 || err.message?.includes('72 tiếng') || err.message?.includes('LEAVE_MULTI_DAY_ADVANCE_NOTICE_REQUIRED')) {
          blocked = true;
        }
      }

      if (blocked) {
        testResults.push({ id: 'TC-LEA-05', name: 'Chặn đơn nghỉ từ 2 ngày trở lên nếu báo trước < 72 tiếng (3 ngày)', status: 'PASS' });
      } else {
        throw new Error('Hệ thống không chặn đơn nghỉ dài ngày tạo gấp < 72 tiếng');
      }
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-05', name: 'Ràng buộc nghỉ >= 2 ngày < 72 tiếng', status: 'FAIL', detail: e.message });
    }

    // TC-LEA-06: Nghỉ từ 2 ngày trở lên trên 72 tiếng -> THÀNH CÔNG
    try {
      console.log('👉 [TC-LEA-06] Thử tạo đơn nghỉ 3 ngày báo trước 4 ngày (>= 72 tiếng)...');
      const now = moment().tz('Asia/Ho_Chi_Minh');
      const start6 = now.clone().add(4, 'days').startOf('day').add(8, 'hours');
      const end6 = start6.clone().add(2, 'days').add(9, 'hours');

      const req = await requestsService.create(
        {
          type: EmployeeRequestType.LEAVE,
          title: 'Xin nghỉ 3 ngày hợp lệ (báo trước > 72 tiếng)',
          content: 'Nghỉ phép cá nhân kế hoạch trước',
          attachmentMetadata: {
            leaveDurationType: 'Nhiều ngày',
            fromDate: start6.toISOString(),
            toDate: end6.toISOString(),
            totalDays: 3,
          },
        } as any,
        requesterActor,
      );
      createdRequestIds.push(req.id);
      testResults.push({ id: 'TC-LEA-06', name: 'Cho phép tạo đơn nghỉ >= 2 ngày khi báo trước >= 72 tiếng thành công', status: 'PASS' });
    } catch (e: any) {
      testResults.push({ id: 'TC-LEA-06', name: 'Tạo đơn nghỉ >= 2 ngày hợp lệ >= 72 tiếng', status: 'FAIL', detail: e.message });
    }

  } catch (fatalErr: any) {
    console.error('❌ Lỗi nghiêm trọng khi chạy test:', fatalErr);
  } finally {
    // DỌN DẸP DỮ LIỆU TEST
    console.log(`\n🧹 [CLEANUP] Đang dọn dẹp ${createdRequestIds.length} đơn test tạm...`);
    for (const reqId of createdRequestIds) {
      await prisma.employeeRequest.delete({ where: { id: reqId } }).catch(() => null);
    }
    console.log('✅ [CLEANUP] Đã dọn dẹp sạch sẽ dữ liệu test.\n');
    await prisma.$disconnect();
  }

  // BÁO CÁO KẾT QUẢ TỔNG HỢP
  console.log('======================================================================');
  console.log('📊 KẾT QUẢ TỔNG HỢP KIỂM THỬ TỰ ĐỘNG (AUTOMATED TEST REPORT)');
  console.log('======================================================================');
  console.table(
    testResults.map((r) => ({
      'Mã TC': r.id,
      'Nội dung kiểm thử': r.name,
      'Kết quả': r.status === 'PASS' ? '✅ PASS' : '❌ FAIL',
      'Chi tiết': r.status === 'PASS' ? 'Thành công 100%' : r.detail,
    })),
  );

  const passCount = testResults.filter((r) => r.status === 'PASS').length;
  const failCount = testResults.filter((r) => r.status === 'FAIL').length;
  console.log(`\n🎯 TỔNG SỐ: ${testResults.length} test cases | ✅ ĐẠT: ${passCount} | ❌ THẤT BẠI: ${failCount}`);
}

runTodayAutomatedTests();
