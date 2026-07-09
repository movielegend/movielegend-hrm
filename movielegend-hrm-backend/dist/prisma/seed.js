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
const prisma = new client_1.PrismaClient();
const permissionCodes = [
    'user.read',
    'user.update',
    'user.manage',
    'employee.read',
    'employee.update',
    'employee.approve',
    'department.create',
    'department.read',
    'department.update',
    'department.delete',
    'position.create',
    'position.read',
    'position.update',
    'position.delete',
    'upload.create',
    'role.assign',
    'permission.read',
    'approval.read',
    'approval.approve',
    'approval.reject',
    'face.read',
    'face.approve',
    'shift.create',
    'shift.read',
    'shift.update',
    'shift.delete',
    'shift.assign',
    'shift.register',
    'shift.swap',
    'attendance.read',
    'attendance.checkin',
    'attendance.adjust',
    'attendance.location.manage',
    'leave.type.manage',
    'leave.balance.read',
    'leave.request',
    'leave.approve',
    'overtime.request',
    'overtime.approve',
    'employee.request',
    'employee.request.approve',
    'task.assign_any',
    'task.assign_department',
    'task.read_all',
    'task.read_department',
    'task.read_own',
    'task.review_all',
    'task.review_department',
    'task.accept_own',
    'task.update_progress_own',
    'task.submit_own',
    'task.comment_own',
    'task.extension_request_own',
    'task.extension_review_all',
    'task.extension_review_department',
    'task.group.manage_all',
    'task.group.manage_department',
    'cross_department.create',
    'cross_department.read_all',
    'cross_department.source_approve',
    'cross_department.target_receive',
    'notification.read',
    'device_token.manage_own',
    'warehouse.create',
    'warehouse.read',
    'warehouse.update',
    'warehouse.manage',
    'material.create',
    'material.read',
    'material.update',
    'stock.read',
    'stock.import',
    'stock.export',
    'stock.adjust',
    'stock.transfer',
    'material_issue.create',
    'material_issue.read',
    'material_issue.approve',
    'material_issue.issue',
    'asset.create',
    'asset.read',
    'asset.assign',
    'asset.return',
    'asset.transfer',
    'asset.incident.create',
    'asset.incident.read',
    'asset.incident.resolve',
    'asset.maintenance.manage',
    'inventory_check.create',
    'inventory_check.read',
    'inventory_check.submit',
    'inventory_check.approve',
    'salary_profile.create',
    'salary_profile.read',
    'salary_profile.update',
    'salary_component.create',
    'salary_component.read',
    'salary_component.update',
    'payroll_period.create',
    'payroll_period.read',
    'payroll.calculate',
    'payroll.review',
    'payroll.approve',
    'payroll.lock',
    'payroll.read_all',
    'payroll.read_own',
    'bonus.create',
    'bonus.read',
    'bonus.approve',
    'deduction.create',
    'deduction.read',
    'deduction.approve',
    'violation.create',
    'violation.read',
    'violation.confirm',
    'disciplinary_action.create',
    'disciplinary_action.approve',
    'employee_document.read_own',
    'employee_document.read_department',
    'employee_document.read_all',
    'employee_document.read_sensitive',
    'employee_document.create',
    'employee_document.verify',
    'contract_template.create',
    'contract_template.read',
    'contract_template.update',
    'contract.create',
    'contract.read_own',
    'contract.read_department',
    'contract.read_all',
    'contract.approve',
    'contract.sign_company',
    'contract.terminate',
    'kpi_template.create',
    'kpi_template.read',
    'kpi_template.update',
    'kpi.assign',
    'kpi.read_own',
    'kpi.read_department',
    'kpi.read_all',
    'kpi.self_review',
    'kpi.leader_review',
    'kpi.finalize',
    'review_cycle.create',
    'review_cycle.read',
    'review_cycle.manage',
    'performance_review.read_own',
    'performance_review.read_department',
    'performance_review.read_all',
    'performance_review.self_submit',
    'performance_review.leader_submit',
    'performance_review.finalize',
    'dashboard.admin.read',
    'dashboard.department.read',
    'dashboard.own.read',
    'report.employee.read',
    'report.attendance.read',
    'report.task.read',
    'report.payroll.summary',
    'report.payroll.detail',
    'report.warehouse.read',
    'report.asset.read',
    'report.kpi.read',
    'report.export.csv',
    'report.export.excel',
    'system_setting.read',
    'system_setting.update',
    'notification_preference.read_own',
    'notification_preference.update_own',
    'audit.read',
    'job.read',
    'job.run_manual',
];
async function main() {
    const company = await prisma.company.upsert({
        where: { code: 'MOVIE_LEGEND' },
        update: {},
        create: { code: 'MOVIE_LEGEND', name: 'Movie Legend' },
    });
    await prisma.department.upsert({
        where: { companyId_code: { companyId: company.id, code: 'MEDIA' } },
        update: {},
        create: { companyId: company.id, code: 'MEDIA', name: 'Media' },
    });
    await prisma.department.upsert({
        where: { companyId_code: { companyId: company.id, code: 'MARKETING' } },
        update: {},
        create: { companyId: company.id, code: 'MARKETING', name: 'Marketing' },
    });
    const permissions = await Promise.all(permissionCodes.map((code) => prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code },
    })));
    const admin = await prisma.role.upsert({
        where: { code: 'ADMIN' },
        update: {},
        create: { code: 'ADMIN', name: 'Admin' },
    });
    const leader = await prisma.role.upsert({
        where: { code: 'LEADER' },
        update: {},
        create: { code: 'LEADER', name: 'Leader' },
    });
    const employee = await prisma.role.upsert({
        where: { code: 'EMPLOYEE' },
        update: {},
        create: { code: 'EMPLOYEE', name: 'Employee' },
    });
    const warehouseManager = await prisma.role.upsert({
        where: { code: 'WAREHOUSE_MANAGER' },
        update: {},
        create: { code: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager' },
    });
    const accountant = await prisma.role.upsert({
        where: { code: 'ACCOUNTANT' },
        update: {},
        create: { code: 'ACCOUNTANT', name: 'Accountant' },
    });
    const hr = await prisma.role.upsert({
        where: { code: 'HR' },
        update: {},
        create: { code: 'HR', name: 'Human Resources' },
    });
    for (const permission of permissions) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: admin.id, permissionId: permission.id } },
            update: {},
            create: { roleId: admin.id, permissionId: permission.id },
        });
    }
    for (const code of [
        'user.read',
        'employee.read',
        'employee.approve',
        'department.read',
        'position.read',
        'upload.create',
        'approval.read',
        'approval.approve',
        'approval.reject',
        'face.read',
        'shift.read',
        'shift.assign',
        'attendance.read',
        'leave.balance.read',
        'leave.approve',
        'overtime.approve',
        'employee.request.approve',
        'task.assign_department',
        'task.read_department',
        'task.review_department',
        'task.extension_review_department',
        'task.group.manage_department',
        'cross_department.source_approve',
        'cross_department.target_receive',
        'notification.read',
        'device_token.manage_own',
        'material.read',
        'stock.read',
        'material_issue.create',
        'material_issue.read',
        'asset.read',
        'asset.incident.create',
        'inventory_check.read',
        'bonus.create',
        'bonus.read',
        'violation.create',
        'violation.read',
        'employee_document.read_department',
        'kpi.read_department',
        'kpi.leader_review',
        'performance_review.read_department',
        'performance_review.leader_submit',
        'dashboard.department.read',
        'report.employee.read',
        'report.attendance.read',
        'report.task.read',
        'report.asset.read',
        'report.kpi.read',
        'report.export.csv',
    ]) {
        const permission = permissions.find((item) => item.code === code);
        if (permission) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: leader.id, permissionId: permission.id } },
                update: {},
                create: { roleId: leader.id, permissionId: permission.id },
            });
        }
    }
    for (const code of [
        'employee.read',
        'department.read',
        'position.read',
        'upload.create',
        'face.read',
        'shift.read',
        'shift.register',
        'shift.swap',
        'attendance.read',
        'attendance.checkin',
        'attendance.adjust',
        'leave.balance.read',
        'leave.request',
        'overtime.request',
        'employee.request',
        'task.read_own',
        'task.accept_own',
        'task.update_progress_own',
        'task.submit_own',
        'task.comment_own',
        'task.extension_request_own',
        'cross_department.create',
        'notification.read',
        'device_token.manage_own',
        'material.read',
        'material_issue.create',
        'material_issue.read',
        'asset.read',
        'asset.return',
        'asset.incident.create',
        'payroll.read_own',
        'employee_document.read_own',
        'employee_document.create',
        'contract.read_own',
        'kpi.read_own',
        'kpi.self_review',
        'performance_review.read_own',
        'performance_review.self_submit',
        'dashboard.own.read',
        'notification_preference.read_own',
        'notification_preference.update_own',
    ]) {
        const permission = permissions.find((item) => item.code === code);
        if (permission) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: employee.id, permissionId: permission.id } },
                update: {},
                create: { roleId: employee.id, permissionId: permission.id },
            });
        }
    }
    for (const code of [
        'employee_document.read_own',
        'employee_document.read_department',
        'employee_document.read_all',
        'employee_document.read_sensitive',
        'employee_document.create',
        'position.read',
        'position.create',
        'position.update',
        'upload.create',
        'shift.read',
        'shift.create',
        'shift.update',
        'shift.assign',
        'employee_document.verify',
        'contract_template.create',
        'contract_template.read',
        'contract_template.update',
        'contract.create',
        'contract.read_own',
        'contract.read_department',
        'contract.read_all',
        'contract.approve',
        'contract.sign_company',
        'contract.terminate',
        'kpi_template.create',
        'kpi_template.read',
        'kpi_template.update',
        'kpi.assign',
        'kpi.read_own',
        'kpi.read_department',
        'kpi.read_all',
        'kpi.self_review',
        'kpi.leader_review',
        'kpi.finalize',
        'review_cycle.create',
        'review_cycle.read',
        'review_cycle.manage',
        'performance_review.read_own',
        'performance_review.read_department',
        'performance_review.read_all',
        'performance_review.self_submit',
        'performance_review.leader_submit',
        'performance_review.finalize',
        'dashboard.admin.read',
        'dashboard.department.read',
        'dashboard.own.read',
        'report.employee.read',
        'report.attendance.read',
        'report.task.read',
        'report.kpi.read',
        'report.export.csv',
        'report.export.excel',
        'system_setting.read',
        'system_setting.update',
        'audit.read',
        'job.read',
        'job.run_manual',
        'notification.read',
        'device_token.manage_own',
    ]) {
        const permission = permissions.find((item) => item.code === code);
        if (permission) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: hr.id, permissionId: permission.id } },
                update: {},
                create: { roleId: hr.id, permissionId: permission.id },
            });
        }
    }
    for (const code of [
        'salary_profile.create',
        'salary_profile.read',
        'salary_profile.update',
        'salary_component.create',
        'salary_component.read',
        'salary_component.update',
        'payroll_period.create',
        'payroll_period.read',
        'payroll.calculate',
        'payroll.review',
        'payroll.approve',
        'payroll.lock',
        'payroll.read_all',
        'report.payroll.summary',
        'report.payroll.detail',
        'report.export.csv',
        'report.export.excel',
        'bonus.create',
        'bonus.read',
        'bonus.approve',
        'deduction.create',
        'deduction.read',
        'deduction.approve',
        'violation.read',
        'disciplinary_action.approve',
        'notification.read',
    ]) {
        const permission = permissions.find((item) => item.code === code);
        if (permission) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: accountant.id, permissionId: permission.id } },
                update: {},
                create: { roleId: accountant.id, permissionId: permission.id },
            });
        }
    }
    for (const code of [
        'warehouse.read',
        'warehouse.update',
        'warehouse.manage',
        'material.read',
        'stock.read',
        'stock.import',
        'stock.export',
        'stock.adjust',
        'stock.transfer',
        'material_issue.read',
        'material_issue.approve',
        'material_issue.issue',
        'asset.read',
        'asset.assign',
        'asset.return',
        'asset.incident.read',
        'asset.incident.resolve',
        'asset.maintenance.manage',
        'inventory_check.create',
        'inventory_check.read',
        'inventory_check.submit',
        'inventory_check.approve',
        'dashboard.department.read',
        'report.warehouse.read',
        'report.asset.read',
        'report.export.csv',
        'report.export.excel',
        'notification.read',
        'device_token.manage_own',
    ]) {
        const permission = permissions.find((item) => item.code === code);
        if (permission) {
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: warehouseManager.id, permissionId: permission.id } },
                update: {},
                create: { roleId: warehouseManager.id, permissionId: permission.id },
            });
        }
    }
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPhone = process.env.SEED_ADMIN_PHONE;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminPhone || !adminPassword) {
        console.warn('Bỏ qua seed admin vì thiếu SEED_ADMIN_PHONE hoặc SEED_ADMIN_PASSWORD');
        return;
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const rows = await prisma.$queryRaw `SELECT nextval('user_code_seq')`;
    const userCode = `NV${rows[0].nextval.toString().padStart(6, '0')}`;
    const adminUser = await prisma.user.upsert({
        where: { phone: adminPhone },
        update: {
            email: adminEmail,
            passwordHash,
            accountStatus: client_1.AccountStatus.ACTIVE,
            approvalStatus: client_1.ApprovalStatus.APPROVED,
            isActive: true,
        },
        create: {
            userCode,
            phone: adminPhone,
            email: adminEmail,
            passwordHash,
            accountStatus: client_1.AccountStatus.ACTIVE,
            approvalStatus: client_1.ApprovalStatus.APPROVED,
            isActive: true,
            profile: {
                create: {
                    fullName: 'Admin Movie Legend',
                    idCardNumber: `ADMIN-${Date.now()}`,
                    employmentStatus: client_1.EmploymentStatus.OFFICIAL,
                },
            },
        },
    });
    const existingAdminRole = await prisma.userRole.findFirst({
        where: {
            userId: adminUser.id,
            roleId: admin.id,
            scopeType: client_1.RoleScopeType.GLOBAL,
            scopeId: null,
        },
    });
    if (!existingAdminRole) {
        await prisma.userRole.create({
            data: {
                userId: adminUser.id,
                roleId: admin.id,
                scopeType: client_1.RoleScopeType.GLOBAL,
            },
        });
    }
}
main()
    .finally(async () => {
    await prisma.$disconnect();
})
    .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map