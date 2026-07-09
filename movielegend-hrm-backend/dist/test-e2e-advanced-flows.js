"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const client_1 = require("@prisma/client");
const attendance_service_1 = require("./src/modules/attendance/attendance.service");
const tasks_service_1 = require("./src/modules/tasks/tasks.service");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('======================================================');
    console.log('--- BẮT ĐẦU TEST E2E ADVANCED CÁC LUỒNG CỦA USER ---');
    console.log('======================================================\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const attendanceService = app.get(attendance_service_1.AttendanceService);
    const tasksService = app.get(tasks_service_1.TasksService);
    const employeeData = await prisma.user.findFirst({
        where: { userCode: { startsWith: 'EMP' } },
        include: {
            departmentLinks: { include: { department: true } },
            roles: { include: { role: true } },
            profile: true
        },
    });
    const leaderData = await prisma.user.findFirst({
        where: {
            userCode: { startsWith: 'LDR' },
            departmentLinks: { some: { departmentId: employeeData?.departmentLinks[0].departmentId } }
        },
        include: {
            departmentLinks: { include: { department: true } },
            roles: { include: { role: true } },
        },
    });
    if (!employeeData || !leaderData) {
        throw new Error('Không tìm thấy Leader/Employee để test. Hãy chạy "npm run seed:mock" trước.');
    }
    const dept = employeeData.departmentLinks[0].department;
    console.log(`[1] Chuẩn bị Dữ liệu`);
    console.log(`  -> Leader: ${leaderData.userCode} (Dept: ${dept.code})`);
    const empPermissions = await prisma.rolePermission.findMany({
        where: { roleId: { in: employeeData.roles.map((r) => r.roleId) } },
        include: { permission: true },
    });
    const leaderPermissions = await prisma.rolePermission.findMany({
        where: { roleId: { in: leaderData.roles.map((r) => r.roleId) } },
        include: { permission: true },
    });
    const empActor = {
        sub: employeeData.id,
        userId: employeeData.id,
        roles: employeeData.roles.map((r) => r.role.code),
        permissions: empPermissions.map(rp => rp.permission.code),
        scopes: employeeData.roles.map((r) => ({ role: r.role.code, scopeType: r.scopeType, scopeId: r.scopeId })),
    };
    const leaderActor = {
        sub: leaderData.id,
        userId: leaderData.id,
        roles: leaderData.roles.map((r) => r.role.code),
        permissions: leaderPermissions.map(rp => rp.permission.code),
        scopes: leaderData.roles.map((r) => ({ role: r.role.code, scopeType: r.scopeType, scopeId: r.scopeId })),
    };
    console.log(`[2] ATTENDANCE FLOW: Check-in, Check-out, Adjustment`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let shiftAssignment = await prisma.shiftAssignment.findFirst({
        where: { userId: empActor.userId, workDate: today },
    });
    if (!shiftAssignment) {
        const shift = await prisma.shift.findFirst();
        shiftAssignment = await prisma.shiftAssignment.create({
            data: {
                userId: empActor.userId,
                departmentId: dept.id,
                shiftId: shift.id,
                workDate: today,
                status: client_1.ShiftAssignmentStatus.ASSIGNED,
            },
        });
    }
    await prisma.attendanceRecord.deleteMany({
        where: { userId: empActor.userId, workDate: today }
    });
    const todayStr = today.toISOString().split('T')[0];
    let loc = await prisma.attendanceLocation.findFirst({ where: { departments: { some: { id: dept.id } } } });
    if (!loc) {
        loc = await prisma.attendanceLocation.create({
            data: {
                name: 'Chi nhánh Test',
                latitude: 21.0285,
                longitude: 105.8048,
                radiusMeters: 5000,
                departments: { connect: { id: dept.id } },
            },
        });
    }
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    try {
        const checkinRes = await attendanceService.checkIn({ latitude: lat, longitude: lng, workDate: todayStr, faceImage: 'fake_image' }, empActor);
        console.log(`  -> CHECK-IN THÀNH CÔNG: ID = ${checkinRes.id}, Trạng thái = ${checkinRes.status}`);
        const checkoutRes = await attendanceService.checkOut({ latitude: lat, longitude: lng }, empActor);
        console.log(`  -> CHECK-OUT THÀNH CÔNG: Trạng thái = ${checkoutRes.status}`);
        const newCheckIn = new Date(today);
        newCheckIn.setHours(7, 45, 0, 0);
        const adjustment = await attendanceService.createAdjustment({
            attendanceRecordId: checkoutRes.id,
            requestedCheckInAt: newCheckIn.toISOString(),
            reason: 'Quên bấm checkin lúc sáng sớm',
        }, empActor);
        console.log(`  -> TẠO ĐIỀU CHỈNH THÀNH CÔNG: ID = ${adjustment.id}, Trạng thái = ${adjustment.status}`);
        const approvedAdj = await attendanceService.approveAdjustment(adjustment.id, leaderActor);
        console.log(`  -> LEADER DUYỆT ĐIỀU CHỈNH THÀNH CÔNG: Trạng thái = ${approvedAdj.status}`);
    }
    catch (err) {
        console.log(`  -> LỖI ATTENDANCE FLOW: ${err.message || err.response?.message || err}`);
    }
    console.log('\n[3] TASKS FLOW: Giao việc, Cập nhật, Nộp và Duyệt');
    try {
        const startAt = new Date();
        const dueAt = new Date();
        dueAt.setDate(dueAt.getDate() + 2);
        const task = await tasksService.create({
            title: 'Báo cáo doanh thu tháng',
            description: 'Tổng hợp số liệu doanh thu từ các kênh',
            priority: client_1.TaskPriority.HIGH,
            type: client_1.TaskType.INDIVIDUAL,
            startAt: startAt.toISOString(),
            dueAt: dueAt.toISOString(),
            departmentContextId: dept.id,
            targets: [
                { targetType: client_1.TaskTargetType.USER, targetId: empActor.userId }
            ]
        }, leaderActor);
        console.log(`  -> LEADER TẠO TASK THÀNH CÔNG: ID = ${task.id}, Tiêu đề = ${task.title}`);
        const assignmentId = task.assignments[0].id;
        await tasksService.acceptAssignment(assignmentId, empActor);
        console.log(`  -> EMPLOYEE ĐÃ CHẤP NHẬN TASK`);
        await tasksService.updateProgress(assignmentId, { progressPercent: 50 }, empActor);
        console.log(`  -> EMPLOYEE ĐÃ CẬP NHẬT TIẾN ĐỘ 50%`);
        const newDueAt = new Date(dueAt);
        newDueAt.setDate(newDueAt.getDate() + 3);
        const extension = await tasksService.requestExtension(task.id, { assignmentId, requestedDueAt: newDueAt.toISOString(), reason: 'Cần thêm thời gian lấy số liệu kênh B' }, empActor);
        console.log(`  -> EMPLOYEE XIN GIA HẠN THÀNH CÔNG`);
        await tasksService.approveExtension(extension.id, leaderActor);
        console.log(`  -> LEADER DUYỆT GIA HẠN THÀNH CÔNG`);
        await tasksService.submitAssignment(assignmentId, { completionNote: 'Đã hoàn thành toàn bộ' }, empActor);
        console.log(`  -> EMPLOYEE NỘP TASK THÀNH CÔNG`);
        await tasksService.approveAssignment(assignmentId, { note: 'Làm tốt' }, leaderActor);
        console.log(`  -> LEADER PHÊ DUYỆT TASK THÀNH CÔNG`);
    }
    catch (err) {
        console.log(`  -> LỖI TASKS FLOW: ${err.message || err.response?.message || err}`);
    }
    console.log('\n[4] ACKNOWLEDGEMENT FLOW: Hợp đồng và Giấy tờ cá nhân');
    try {
        const contractsService = app.get(require('./src/modules/contracts/contracts.service').ContractsService);
        const documentsService = app.get(require('./src/modules/employee-documents/employee-documents.service').EmployeeDocumentsService);
        const doc = await prisma.employeeDocument.create({
            data: {
                userId: empActor.userId,
                employeeId: employeeData.profile.id,
                type: 'ID_CARD',
                fileName: 'CCCD.pdf',
                fileUrl: 'https://example.com/cccd.pdf',
                status: 'VERIFIED'
            }
        });
        await documentsService.acknowledge(doc.id, { isAgreed: true }, '192.168.1.1', empActor);
        console.log(`  -> EMPLOYEE ĐỒNG Ý GIẤY TỜ THÀNH CÔNG: ID = ${doc.id}`);
        let company = await prisma.company.findFirst();
        if (!company) {
            company = await prisma.company.create({ data: { code: 'CMP1', name: 'Company 1' } });
        }
        let template = await prisma.contractTemplate.findFirst({ where: { companyId: company.id } });
        if (!template) {
            template = await prisma.contractTemplate.create({
                data: {
                    companyId: company.id,
                    code: 'TPL1',
                    name: 'Template 1',
                    contractType: 'PROBATION',
                    templateFileUrl: 'url',
                    createdById: leaderActor.userId
                }
            });
            await prisma.contractTemplateVersion.create({
                data: {
                    contractTemplateId: template.id,
                    versionNumber: 1,
                    templateFileUrl: 'url',
                    createdById: leaderActor.userId
                }
            });
        }
        const version = await prisma.contractTemplateVersion.findFirst({ where: { contractTemplateId: template.id } });
        const contract = await prisma.employeeContract.create({
            data: {
                contractCode: `CTR-${Date.now()}`,
                userId: empActor.userId,
                contractTemplateId: template.id,
                contractTemplateVersionId: version.id,
                contractType: 'PROBATION',
                title: 'Hợp đồng thử việc',
                startDate: new Date(),
                createdById: leaderActor.userId,
                status: 'WAITING_EMPLOYEE_SIGNATURE'
            }
        });
        await contractsService.acknowledgeContract(contract.id, { isAgreed: false, note: 'Sai mức lương' }, '192.168.1.1', empActor);
        console.log(`  -> EMPLOYEE TỪ CHỐI HỢP ĐỒNG THÀNH CÔNG: ID = ${contract.id} (Lý do: Sai mức lương)`);
    }
    catch (err) {
        console.log(`  -> LỖI ACKNOWLEDGEMENT FLOW: ${err.message || err.response?.message || err}`);
    }
    console.log('\n======================================================');
    console.log('--- TEST E2E ADVANCED HOÀN TẤT ---');
    console.log('======================================================\n');
    await app.close();
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=test-e2e-advanced-flows.js.map