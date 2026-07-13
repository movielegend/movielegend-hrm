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
var CloudinaryStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryStorageService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
const streamifier = __importStar(require("streamifier"));
let CloudinaryStorageService = CloudinaryStorageService_1 = class CloudinaryStorageService {
    logger = new common_1.Logger(CloudinaryStorageService_1.name);
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async upload(input) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'hrm',
                public_id: input.storageKey ? input.storageKey.split('.')[0] : undefined,
                resource_type: 'auto',
            }, (error, result) => {
                if (error) {
                    this.logger.error('Upload to Cloudinary failed', error);
                    return reject(error);
                }
                if (!result) {
                    return reject(new Error('Cloudinary upload returned null result'));
                }
                resolve({
                    storageKey: result.public_id,
                    fileUrl: result.secure_url,
                });
            });
            streamifier.createReadStream(input.buffer).pipe(uploadStream);
        });
    }
    async delete(key) {
        try {
            await cloudinary_1.v2.uploader.destroy(key);
        }
        catch (error) {
            this.logger.error(`Failed to delete file from Cloudinary: ${key}`, error);
        }
    }
    async exists(key) {
        try {
            const result = await cloudinary_1.v2.api.resource(key);
            return !!result;
        }
        catch (error) {
            return false;
        }
    }
    getPublicUrl(key) {
        return cloudinary_1.v2.url(key, { secure: true });
    }
    async read(key) {
        throw new Error('read() is not supported by CloudinaryStorageService natively');
    }
};
exports.CloudinaryStorageService = CloudinaryStorageService;
exports.CloudinaryStorageService = CloudinaryStorageService = CloudinaryStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CloudinaryStorageService);
//# sourceMappingURL=cloudinary-storage.service.js.map