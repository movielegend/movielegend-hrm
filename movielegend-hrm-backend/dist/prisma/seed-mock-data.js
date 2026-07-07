"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const vi_1 = require("@faker-js/faker/locale/vi");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Bắt đầu sinh dữ liệu ảo (Mock Data)...');
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({ data: { code: 'MOVIE_LEGEND', name: 'Movie Legend' } });
    }
    const leaderRole = await prisma.role.findUnique({ where: { code: 'LEADER' } });
    const employeeRole = await prisma.role.findUnique({ where: { code: 'EMPLOYEE' } });
    if (!leaderRole || !employeeRole) {
        throw new Error('Vui lòng chạy "npm run seed" trước để khởi tạo các Role cơ bản.');
    }
    const departmentsData = [
        { code: 'HR', name: 'Nhân Sự' },
        { code: 'IT', name: 'Công Nghệ Thông Tin' },
        { code: 'SALES', name: 'Kinh Doanh' },
        { code: 'MKT', name: 'Marketing' },
        { code: 'OPS', name: 'Vận Hành' },
    ];
    const departments = [];
    for (const dept of departmentsData) {
        const d = await prisma.department.upsert({
            where: { companyId_code: { companyId: company.id, code: dept.code } },
            update: {},
            create: { companyId: company.id, code: dept.code, name: dept.name, isActive: true },
        });
        departments.push(d);
    }
    console.log(`Đã tạo/kiểm tra ${departments.length} phòng ban.`);
    const positions = [];
    for (let i = 0; i < 3; i++) {
        const p = await prisma.position.upsert({
            where: { code: `POS_${i}` },
            update: {},
            create: { code: `POS_${i}`, name: vi_1.faker.person.jobTitle(), description: vi_1.faker.person.jobDescriptor(), isActive: true },
        });
        positions.push(p);
    }
    const passwordHash = await bcrypt.hash('123456', 10);
    const allUsers = [];
    for (const dept of departments) {
        const leaderPhone = vi_1.faker.helpers.fromRegExp(/09[0-9]{8}/);
        const leaderCode = vi_1.faker.helpers.fromRegExp(/LDR[0-9]{4}/);
        const leader = await prisma.user.upsert({
            where: { phone: leaderPhone },
            update: {},
            create: {
                userCode: leaderCode,
                phone: leaderPhone,
                email: vi_1.faker.internet.email(),
                passwordHash,
                accountStatus: client_1.AccountStatus.ACTIVE,
                approvalStatus: client_1.ApprovalStatus.APPROVED,
                isActive: true,
                departmentLinks: {
                    create: { departmentId: dept.id, isPrimary: true, positionId: positions[0].id },
                },
                profile: {
                    create: {
                        fullName: vi_1.faker.person.fullName(),
                        idCardNumber: vi_1.faker.string.numeric(12),
                        gender: 'MALE',
                        employmentStatus: client_1.EmploymentStatus.OFFICIAL,
                        joinDate: vi_1.faker.date.past({ years: 2 }),
                    },
                },
            },
        });
        const leaderScope = await prisma.userRole.findFirst({ where: { userId: leader.id, roleId: leaderRole.id } });
        if (!leaderScope) {
            await prisma.userRole.create({
                data: {
                    userId: leader.id,
                    roleId: leaderRole.id,
                    scopeType: client_1.RoleScopeType.DEPARTMENT,
                    scopeId: dept.id,
                },
            });
        }
        allUsers.push({ user: leader, role: 'LEADER', departmentId: dept.id });
        const numEmployees = vi_1.faker.number.int({ min: 3, max: 4 });
        for (let i = 0; i < numEmployees; i++) {
            const empPhone = vi_1.faker.helpers.fromRegExp(/0[3578][0-9]{8}/);
            const empCode = vi_1.faker.helpers.fromRegExp(/EMP[0-9]{4}/);
            const emp = await prisma.user.upsert({
                where: { phone: empPhone },
                update: {},
                create: {
                    userCode: empCode,
                    phone: empPhone,
                    email: vi_1.faker.internet.email(),
                    passwordHash,
                    accountStatus: client_1.AccountStatus.ACTIVE,
                    approvalStatus: client_1.ApprovalStatus.APPROVED,
                    isActive: true,
                    departmentLinks: {
                        create: { departmentId: dept.id, isPrimary: true, positionId: positions[1].id },
                    },
                    profile: {
                        create: {
                            fullName: vi_1.faker.person.fullName(),
                            idCardNumber: vi_1.faker.string.numeric(12),
                            gender: vi_1.faker.helpers.arrayElement(['MALE', 'FEMALE']),
                            employmentStatus: client_1.EmploymentStatus.OFFICIAL,
                            joinDate: vi_1.faker.date.past({ years: 1 }),
                        },
                    },
                },
            });
            const empScope = await prisma.userRole.findFirst({ where: { userId: emp.id, roleId: employeeRole.id } });
            if (!empScope) {
                await prisma.userRole.create({
                    data: {
                        userId: emp.id,
                        roleId: employeeRole.id,
                        scopeType: client_1.RoleScopeType.GLOBAL,
                    },
                });
            }
            allUsers.push({ user: emp, role: 'EMPLOYEE', departmentId: dept.id });
        }
    }
    console.log(`Đã tạo ${allUsers.length} Users (Leaders & Employees). Password chung: 123456`);
    const shiftsData = [
        { code: 'HC', name: 'Ca Hành Chính', startTime: '08:00', endTime: '17:00' },
        { code: 'SANG', name: 'Ca Sáng', startTime: '06:00', endTime: '14:00' },
        { code: 'CHIEU', name: 'Ca Chiều', startTime: '14:00', endTime: '22:00' },
    ];
    const shifts = [];
    for (const s of shiftsData) {
        const shift = await prisma.shift.upsert({
            where: { code: s.code },
            update: {},
            create: {
                code: s.code,
                name: s.name,
                startTime: s.startTime,
                endTime: s.endTime,
                isActive: true,
            },
        });
        shifts.push(shift);
    }
    console.log(`Đã tạo ${shifts.length} Ca làm việc.`);
    let annualLeave = await prisma.leaveType.findFirst({ where: { code: 'ANNUAL' } });
    if (!annualLeave) {
        annualLeave = await prisma.leaveType.create({
            data: { code: 'ANNUAL', name: 'Nghỉ Phép Năm', isPaid: true },
        });
    }
    const currentYear = new Date().getFullYear();
    for (const u of allUsers) {
        await prisma.leaveBalance.upsert({
            where: {
                userId_leaveTypeId_year: {
                    userId: u.user.id,
                    leaveTypeId: annualLeave.id,
                    year: currentYear,
                },
            },
            update: {},
            create: {
                userId: u.user.id,
                leaveTypeId: annualLeave.id,
                year: currentYear,
                balanceDays: 12,
                usedDays: 0,
            },
        });
    }
    console.log(`Đã cấp 12 ngày phép năm cho tất cả Users.`);
    const today = new Date();
    let leaveRequestsCount = 0;
    for (const u of allUsers) {
        if (u.role === 'EMPLOYEE' && vi_1.faker.datatype.boolean({ probability: 0.3 })) {
            const startDate = vi_1.faker.date.recent({ days: 10 });
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + vi_1.faker.number.int({ min: 0, max: 2 }));
            const status = vi_1.faker.helpers.arrayElement([
                client_1.LeaveRequestStatus.PENDING,
                client_1.LeaveRequestStatus.APPROVED,
                client_1.LeaveRequestStatus.REJECTED,
            ]);
            await prisma.leaveRequest.create({
                data: {
                    userId: u.user.id,
                    departmentId: u.departmentId,
                    leaveTypeId: annualLeave.id,
                    startDate: startDate,
                    endDate: endDate,
                    totalDays: String(vi_1.faker.number.int({ min: 1, max: 3 })),
                    reason: vi_1.faker.lorem.sentence(),
                    status: status,
                },
            });
            leaveRequestsCount++;
        }
    }
    console.log(`Đã tạo ngẫu nhiên ${leaveRequestsCount} đơn xin phép.`);
    let attendanceCount = 0;
    for (let i = 0; i < 5; i++) {
        const workDate = new Date();
        workDate.setDate(today.getDate() - i);
        workDate.setHours(0, 0, 0, 0);
        for (const u of allUsers) {
            if (u.role === 'EMPLOYEE') {
                const shift = vi_1.faker.helpers.arrayElement(shifts);
                const assignment = await prisma.shiftAssignment.create({
                    data: {
                        userId: u.user.id,
                        departmentId: u.departmentId,
                        shiftId: shift.id,
                        workDate: workDate,
                        status: client_1.ShiftAssignmentStatus.ASSIGNED,
                    },
                });
                if (i > 0 && vi_1.faker.datatype.boolean({ probability: 0.8 })) {
                    const shiftStartH = parseInt(shift.startTime.split(':')[0]);
                    const shiftEndH = parseInt(shift.endTime.split(':')[0]);
                    const checkInTime = new Date(workDate);
                    checkInTime.setHours(shiftStartH, vi_1.faker.number.int({ min: 0, max: 15 }), 0, 0);
                    const checkOutTime = new Date(workDate);
                    checkOutTime.setHours(shiftEndH, vi_1.faker.number.int({ min: 0, max: 30 }), 0, 0);
                    await prisma.attendanceRecord.create({
                        data: {
                            userId: u.user.id,
                            departmentId: u.departmentId,
                            shiftAssignmentId: assignment.id,
                            workDate: workDate,
                            checkInAt: checkInTime,
                            checkOutAt: checkOutTime,
                            status: client_1.AttendanceStatus.CHECKED_OUT,
                        },
                    });
                    attendanceCount++;
                }
            }
        }
    }
    console.log(`Đã gán ca và tạo ${attendanceCount} bản ghi chấm công (cho 5 ngày gần nhất).`);
    console.log('HOÀN TẤT SINH DỮ LIỆU MOCK !');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed-mock-data.js.map