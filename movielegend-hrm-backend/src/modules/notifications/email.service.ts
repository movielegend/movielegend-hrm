import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('SMTP_FROM') || '"MovieLegend HRM" <noreply@movielegend.vn>';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`EmailService configured with host: ${host}`);
    } else {
      this.logger.warn('EmailService is not configured (missing SMTP environment variables). Emails will not be sent.');
    }
  }

  async sendAccountApprovedEmail(toEmail: string, fullName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send approval email to ${toEmail} because SMTP is not configured.`);
      return;
    }

    try {
      const subject = 'Tài khoản MovieLegend HRM của bạn đã được duyệt';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4CAF50;">Chúc mừng!</h2>
          <p>Chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản của bạn trên hệ thống <strong>MovieLegend HRM</strong> đã được ban quản trị phê duyệt.</p>
          <p>Bây giờ bạn đã có thể đăng nhập vào ứng dụng và sử dụng các tính năng của hệ thống.</p>
          <br/>
          <p>Trân trọng,</p>
          <p><strong>Ban Quản Trị MovieLegend</strong></p>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.from,
        to: toEmail,
        subject,
        html,
      });

      this.logger.log(`Account approval email sent successfully to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send approval email to ${toEmail}`, error instanceof Error ? error.stack : String(error));
    }
  }
}
