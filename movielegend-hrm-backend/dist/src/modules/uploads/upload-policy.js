"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maxUploadSize = exports.uploadPolicies = void 0;
const client_1 = require("@prisma/client");
exports.uploadPolicies = {
    FACE_REGISTRATION: {
        purpose: client_1.UploadPurpose.FACE_REGISTRATION,
        maxSize: 3 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    },
    ATTENDANCE: {
        purpose: client_1.UploadPurpose.ATTENDANCE,
        maxSize: 3 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    },
    TASK_ATTACHMENT: {
        purpose: client_1.UploadPurpose.TASK_ATTACHMENT,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.docx', '.xlsx'],
    },
    EMPLOYEE_DOCUMENT: {
        purpose: client_1.UploadPurpose.EMPLOYEE_DOCUMENT,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    },
    CONTRACT_TEMPLATE: {
        purpose: client_1.UploadPurpose.CONTRACT_TEMPLATE,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        extensions: ['.pdf', '.docx'],
    },
    SIGNATURE: {
        purpose: client_1.UploadPurpose.SIGNATURE,
        maxSize: 1 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    },
    KPI_EVIDENCE: {
        purpose: client_1.UploadPurpose.KPI_EVIDENCE,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    },
    ASSET_INCIDENT: {
        purpose: client_1.UploadPurpose.ASSET_INCIDENT,
        maxSize: 10 * 1024 * 1024,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    },
};
exports.maxUploadSize = Math.max(...Object.values(exports.uploadPolicies).map((policy) => policy.maxSize));
//# sourceMappingURL=upload-policy.js.map