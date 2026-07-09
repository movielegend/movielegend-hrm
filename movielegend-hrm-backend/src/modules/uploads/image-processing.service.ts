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
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 800;
      const height = metadata.height || 1200;

      const latString = data.latitude ? Number(data.latitude).toFixed(5) : 'N/A';
      const lonString = data.longitude ? Number(data.longitude).toFixed(5) : 'N/A';

      // SVG to composite over the image
      // Top-left: Company Logo (simulated with a colored box + text)
      // Bottom-left: Employee info and coordinates
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

      return sharp(imageBuffer)
        .composite([
          {
            input: Buffer.from(svgImage),
            gravity: 'center',
          },
        ])
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to add watermark', error);
      // Return original buffer if watermarking fails so it doesn't break attendance entirely
      return imageBuffer;
    }
  }
}
