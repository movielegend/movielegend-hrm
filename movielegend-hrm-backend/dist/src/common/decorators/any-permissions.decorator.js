"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnyPermissions = exports.ANY_PERMISSIONS_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ANY_PERMISSIONS_KEY = 'any_permissions';
const AnyPermissions = (...permissions) => (0, common_1.SetMetadata)(exports.ANY_PERMISSIONS_KEY, permissions);
exports.AnyPermissions = AnyPermissions;
//# sourceMappingURL=any-permissions.decorator.js.map