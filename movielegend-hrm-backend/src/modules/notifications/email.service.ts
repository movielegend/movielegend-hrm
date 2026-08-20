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
        family: 4, // Ép dùng IPv4 tránh lỗi ENETUNREACH khi mạng không hỗ trợ IPv6
      } as any);
      this.logger.log(`EmailService configured with host: ${host}`);
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
  async sendPasswordResetOtpEmail(toEmail: string, otpCode: string, fullName: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send OTP email to ${toEmail} because SMTP is not configured.`);
      return;
    }

    try {
      const subject = 'Mã xác nhận quên mật khẩu - MovieLegend HRM';
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4CAF50; text-align: center;">Yêu cầu Đặt lại Mật khẩu</h2>
          <p>Chào <strong>${fullName}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống <strong>MovieLegend HRM</strong>.</p>
          <p>Mã xác thực (OTP) của bạn là:</p>
          <div style="text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; padding: 10px 20px; background-color: #f4f4f4; border-radius: 5px; letter-spacing: 5px;">${otpCode}</span>
          </div>
          <p style="color: #d9534f; font-size: 14px;">Mã này có hiệu lực trong vòng 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
          <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
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

      this.logger.log(`Password reset OTP email sent successfully to ${toEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP email to ${toEmail}`, error instanceof Error ? error.stack : String(error));
    }
  }
}
