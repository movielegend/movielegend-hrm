"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ImageProcessingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessingService = void 0;
const common_1 = require("@nestjs/common");
const sharp_1 = __importDefault(require("sharp"));
let ImageProcessingService = ImageProcessingService_1 = class ImageProcessingService {
    logger = new common_1.Logger(ImageProcessingService_1.name);
    async addAttendanceWatermark(imageBuffer, data) {
        try {
            const metadata = await (0, sharp_1.default)(imageBuffer).metadata();
            const width = metadata.width || 800;
            const height = metadata.height || 1200;
            const latString = data.latitude ? Number(data.latitude).toFixed(5) : 'N/A';
            const lonString = data.longitude ? Number(data.longitude).toFixed(5) : 'N/A';
            const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
            .title { fill: white; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); }
            .subtitle { fill: white; font-size: 18px; font-family: Arial, sans-serif; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }
          </style>
          
          <!-- Logo area (Top Left) -->
          <rect x="20" y="20" width="120" height="40" fill="rgba(0,0,0,0.5)" rx="5" />
          <text x="30" y="47" class="title">${data.companyName || 'MovieLegend'}</text>

          <!-- Info area (Bottom Left) -->
          <rect x="20" y="${height - 120}" width="400" height="100" fill="rgba(0,0,0,0.5)" rx="8" />
          <text x="35" y="${height - 90}" class="title">${data.employeeName} (${data.userCode})</text>
          <text x="35" y="${height - 60}" class="subtitle">Lat: ${latString}, Lng: ${lonString}</text>
          <text x="35" y="${height - 35}" class="subtitle">Time: ${new Date().toLocaleString('vi-VN')}</text>
        </svg>
      `;
            return (0, sharp_1.default)(imageBuffer)
                .composite([
                {
                    input: Buffer.from(svgImage),
                    gravity: 'center',
                },
            ])
                .jpeg({ quality: 85 })
                .toBuffer();
        }
        catch (error) {
            this.logger.error('Failed to add watermark', error);
            return imageBuffer;
        }
    }
};
exports.ImageProcessingService = ImageProcessingService;
exports.ImageProcessingService = ImageProcessingService = ImageProcessingService_1 = __decorate([
    (0, common_1.Injectable)()
], ImageProcessingService);
//# sourceMappingURL=image-processing.service.js.map