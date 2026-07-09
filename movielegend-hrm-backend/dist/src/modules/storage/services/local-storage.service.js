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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const storage_service_1 = require("../storage.service");
let LocalStorageService = class LocalStorageService extends storage_service_1.StorageService {
    root;
    constructor(config) {
        super();
        const driver = config.get('storage.driver') ?? 'local';
        if (process.env.NODE_ENV === 'production' && driver === 'local') {
            throw new Error('Local storage is not allowed in production');
        }
        this.root = path.resolve(config.get('storage.localRoot') ?? 'storage');
    }
    async upload(input) {
        const storageKey = sanitizeStorageKey(input.storageKey ?? input.fileName);
        const target = this.resolveKey(storageKey);
        await fs_1.promises.mkdir(path.dirname(target), { recursive: true });
        await fs_1.promises.writeFile(target, input.buffer, { flag: 'wx' });
        return { storageKey, fileUrl: this.getPublicUrl(storageKey) };
    }
    async delete(key) {
        const target = this.resolveKey(key);
        await fs_1.promises.unlink(target).catch((error) => {
            if (error.code !== 'ENOENT')
                throw error;
        });
    }
    async exists(key) {
        const target = this.resolveKey(key);
        return fs_1.promises
            .access(target)
            .then(() => true)
            .catch(() => false);
    }
    getPublicUrl(key) {
        return `/uploads/${encodeURIComponent(sanitizeStorageKey(key))}`;
    }
    async read(key) {
        const target = this.resolveKey(key);
        return fs_1.promises.readFile(target);
    }
    resolveKey(key) {
        const clean = sanitizeStorageKey(key);
        const target = path.resolve(this.root, clean);
        if (!target.startsWith(this.root + path.sep)) {
            throw new Error('Invalid storage key');
        }
        return target;
    }
};
exports.LocalStorageService = LocalStorageService;
exports.LocalStorageService = LocalStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageService);
function sanitizeStorageKey(value) {
    return value.replace(/\\/g, '/').split('/').filter(Boolean).join('/').replace(/[^a-zA-Z0-9._/-]/g, '_');
}
//# sourceMappingURL=local-storage.service.js.map