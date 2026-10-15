import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';

export interface WatermarkData {
  employeeName: string;
  userCode: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  companyName?: string;
}

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);

  async addAttendanceWatermark(imageBuffer: Buffer, data: WatermarkData): Promise<Buffer> {
    try {
      // 1. Chuẩn hóa góc xoay EXIF trước khi đo metadata (tránh lệch tọa độ camera điện thoại)
      const rotatedBuffer = await sharp(imageBuffer).rotate().toBuffer();
      const metadata = await sharp(rotatedBuffer).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 1200;

      // 2. Tỉ lệ scale co giãn linh hoạt theo độ phân giải ảnh (chuẩn 720px)
      const scale = Math.max(0.65, Math.min(width / 720, 1.8));
      const margin = Math.round(16 * scale);

      // Thoát ký tự đặc biệt XML
      const escapeXml = (unsafe: string) =>
        (unsafe || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');

      const companyName = data.companyName || 'MovieLegend';
      const safeCompanyName = escapeXml(companyName);
      const safeEmployeeName = escapeXml(data.employeeName);
      const safeUserCode = escapeXml(data.userCode);

      // Logo Top-Left: Tự động co giãn theo chiều dài tên công ty
      const logoFontSize = Math.round(18 * scale);
      const logoBoxWidth = Math.round(Math.max(companyName.length * 11.5 + 28, 140) * scale);
      const logoBoxHeight = Math.round(38 * scale);

      // Info Card Bottom: Tự động ôm vừa vặn chiều ngang ảnh, không bao giờ bị tràn lề
      const cardMargin = margin;
      const cardWidth = width - cardMargin * 2;
      const cardHeight = Math.round(108 * scale);
      const cardY = height - cardHeight - cardMargin;
      const cardRx = Math.round(10 * scale);

      const titleFontSize = Math.round(17 * scale);
      const subFontSize = Math.round(13.5 * scale);
      const lineSpacing = Math.round(24 * scale);

      const latString = data.latitude ? Number(data.latitude).toFixed(5) : 'N/A';
      const lonString = data.longitude ? Number(data.longitude).toFixed(5) : 'N/A';

      // Thời gian theo múi giờ Việt Nam (ICT)
      const timeStr = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // SVG banner phủ lên ảnh
      const svgImage = `
        <svg width="${width}" height="${height}">
          <defs>
            <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(15, 23, 42, 0.78)" />
              <stop offset="100%" stop-color="rgba(2, 6, 23, 0.92)" />
            </linearGradient>
          </defs>
          <style>
            .title { fill: #FFFFFF; font-size: ${titleFontSize}px; font-weight: bold; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .subtitle { fill: #E2E8F0; font-size: ${subFontSize}px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
            .brand { fill: #FFFFFF; font-size: ${logoFontSize}px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; letter-spacing: 0.5px; }
          </style>
          
          <!-- Logo area (Top Left) -->
          <rect x="${margin}" y="${margin}" width="${logoBoxWidth}" height="${logoBoxHeight}" rx="${6 * scale}" fill="rgba(15, 23, 42, 0.78)" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
          <text x="${margin + 14 * scale}" y="${margin + 25 * scale}" class="brand">${safeCompanyName}</text>

          <!-- Info card (Bottom) -->
          <rect x="${cardMargin}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${cardRx}" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.18)" stroke-width="1" />
          
          <!-- Thanh viền màu xanh tạo điểm nhấn bên mép trái thẻ -->
          <rect x="${cardMargin}" y="${cardY}" width="${4 * scale}" height="${cardHeight}" rx="${2 * scale}" fill="#0284C7" />

          <!-- Thông tin nhân sự, tọa độ, thời gian -->
          <text x="${cardMargin + 16 * scale}" y="${cardY + 30 * scale}" class="title">${safeEmployeeName} (${safeUserCode})</text>
          <text x="${cardMargin + 16 * scale}" y="${cardY + 30 * scale + lineSpacing}" class="subtitle">Lat: ${latString}, Lng: ${lonString}</text>
          <text x="${cardMargin + 16 * scale}" y="${cardY + 30 * scale + lineSpacing * 2}" class="subtitle">Time: ${timeStr}</text>
        </svg>
      `;

      return sharp(rotatedBuffer)
        .composite([
          {
            input: Buffer.from(svgImage),
            top: 0,
            left: 0,
          },
        ])
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to add watermark', error);
      // Return original buffer if watermarking fails so it doesn't break attendance entirely
      return imageBuffer;
    }
  }
}
