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

  /**
   * Gửi email xác nhận nộp CV và hồ sơ ứng tuyển thành công cho ứng viên
   */
  async sendApplicationConfirmationEmail(
    toEmail: string,
    params: {
      fullName: string;
      jobTitle: string;
      applicationCode: string;
      phone: string;
      cvFileName?: string;
    },
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send application confirmation email to ${toEmail} because SMTP is not configured.`);
      return;
    }

    try {
      const subject = `[Movie Legend] Tiếp nhận hồ sơ ứng tuyển thành công - ${params.jobTitle}`;
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} ngày ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

      const html = `
        <div style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%); padding: 35px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                        MOVIE LEGEND CAREERS
                      </h1>
                      <p style="margin: 6px 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">
                        Cổng Tuyển Dụng & Phát Triển Nhân Tài
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 30px;">
                      
                      <!-- Badge -->
                      <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 5px 14px; margin-bottom: 20px;">
                        <span style="color: #059669; font-size: 13px; font-weight: 700;">
                          ✓ Tải lên CV & Ứng tuyển thành công
                        </span>
                      </div>

                      <h2 style="margin: 0 0 14px; color: #0f172a; font-size: 20px; font-weight: 700;">
                        Xin chào ${params.fullName},
                      </h2>

                      <p style="margin: 0 0 20px; line-height: 1.6; color: #475569; font-size: 14px;">
                        Cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển tại <strong>Movie Legend</strong>. Hệ thống tuyển dụng xác nhận đã nhận được hồ sơ và file CV của bạn một cách an toàn và đầy đủ.
                      </p>

                      <!-- Card thông tin -->
                      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 14px; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                          Chi tiết hồ sơ tiếp nhận:
                        </h3>
                        <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.8;">
                          <tr>
                            <td style="color: #64748b; width: 140px; padding: 5px 0;">Vị trí ứng tuyển:</td>
                            <td style="color: #0f172a; font-weight: 700; padding: 5px 0;">${params.jobTitle}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">Mã hồ sơ:</td>
                            <td style="color: #2563eb; font-weight: 700; font-family: monospace; font-size: 15px; padding: 5px 0;">${params.applicationCode}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">Số điện thoại:</td>
                            <td style="color: #0f172a; font-weight: 500; padding: 5px 0;">${params.phone}</td>
                          </tr>
                          ${params.cvFileName ? `
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">File CV đính kèm:</td>
                            <td style="color: #0f172a; font-weight: 600; padding: 5px 0;">📄 ${params.cvFileName}</td>
                          </tr>` : ''}
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">Thời gian nộp:</td>
                            <td style="color: #0f172a; font-weight: 500; padding: 5px 0;">${timeStr}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Next Steps -->
                      <div style="margin-bottom: 24px;">
                        <h3 style="margin: 0 0 12px; color: #0f172a; font-size: 14px; font-weight: 700;">
                          Các bước tiếp theo:
                        </h3>
                        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.7;">
                          <li style="margin-bottom: 6px;">
                            Bộ phận Tuyển dụng (HR) sẽ xem xét chi tiết hồ sơ và CV của bạn trong vòng <strong>1 - 3 ngày làm việc</strong>.
                          </li>
                          <li style="margin-bottom: 6px;">
                            Nếu phù hợp với yêu cầu vị trí, HR sẽ liên hệ trực tiếp qua điện thoại <strong>${params.phone}</strong> hoặc email này để trao đổi và sắp xếp lịch phỏng vấn.
                          </li>
                          <li>
                            Bạn vui lòng lưu lại mã hồ sơ <strong>${params.applicationCode}</strong> để tiện theo dõi kết quả.
                          </li>
                        </ul>
                      </div>

                      <!-- Contact Note -->
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                        <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.5;">
                          <strong>Cần hỗ trợ?</strong> Bạn có thể phản hồi trực tiếp email này hoặc liên hệ hotline phòng Nhân sự Movie Legend nếu cần bổ sung thông tin hồ sơ.
                        </p>
                      </div>

                      <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Trân trọng,<br/>
                        <strong>Bộ phận Tuyển dụng & Nhân sự Movie Legend</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600;">
                        © ${now.getFullYear()} MOVIE LEGEND. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                        Email này được gửi tự động từ Hệ thống Tuyển dụng Movie Legend.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.from,
        to: toEmail,
        subject,
        html,
      });

      this.logger.log(`Application confirmation email sent successfully to ${toEmail} for application ${params.applicationCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to send application confirmation email to ${toEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Gửi email mời phỏng vấn cho ứng viên
   */
  async sendInterviewInvitationEmail(
    toEmail: string,
    params: {
      fullName: string;
      jobTitle: string;
      applicationCode: string;
      interviewDateStr: string;
      note?: string;
    },
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Cannot send interview invitation email to ${toEmail} because SMTP is not configured.`);
      return;
    }

    try {
      const subject = `[Movie Legend] Thư mời phỏng vấn - Vị trí ${params.jobTitle}`;
      const now = new Date();

      const html = `
        <div style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0f172a 0%, #065f46 60%, #059669 100%); padding: 35px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                        THƯ MỜI PHỎNG VẤN
                      </h1>
                      <p style="margin: 6px 0 0; color: #a7f3d0; font-size: 13px; font-weight: 500;">
                        Movie Legend Careers
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px 30px;">
                      <h2 style="margin: 0 0 14px; color: #0f172a; font-size: 20px; font-weight: 700;">
                        Xin chào ${params.fullName},
                      </h2>

                      <p style="margin: 0 0 20px; line-height: 1.6; color: #475569; font-size: 14px;">
                        Sau khi xem xét hồ sơ ứng tuyển vị trí <strong>${params.jobTitle}</strong> (Mã hồ sơ: <code>${params.applicationCode}</code>), Hội đồng Tuyển dụng <strong>Movie Legend</strong> trân trọng kính mời bạn tham gia buổi phỏng vấn tuyển dụng.
                      </p>

                      <!-- Schedule Card -->
                      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 14px; color: #166534; font-size: 14px; font-weight: 700; text-transform: uppercase;">
                          📅 Lịch phỏng vấn dự kiến:
                        </h3>
                        <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; line-height: 1.8;">
                          <tr>
                            <td style="color: #64748b; width: 140px; padding: 5px 0;">Thời gian:</td>
                            <td style="color: #166534; font-weight: 700; font-size: 15px; padding: 5px 0;">⏰ ${params.interviewDateStr}</td>
                          </tr>
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">Vị trí phỏng vấn:</td>
                            <td style="color: #0f172a; font-weight: 600; padding: 5px 0;">${params.jobTitle}</td>
                          </tr>
                          ${params.note ? `
                          <tr>
                            <td style="color: #64748b; padding: 5px 0;">Ghi chú / Địa điểm:</td>
                            <td style="color: #0f172a; font-weight: 500; padding: 5px 0;">${params.note}</td>
                          </tr>` : ''}
                        </table>
                      </div>

                      <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                        Vui lòng phản hồi email này để xác nhận sự tham gia của bạn hoặc thông báo lại nếu bạn cần điều chỉnh thời gian.
                      </p>

                      <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                        Trân trọng,<br/>
                        <strong>Hội đồng Tuyển dụng Movie Legend</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600;">
                        © ${now.getFullYear()} MOVIE LEGEND. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </div>
      `;

      await this.transporter.sendMail({
        from: this.from,
        to: toEmail,
        subject,
        html,
      });

      this.logger.log(`Interview invitation email sent successfully to ${toEmail} for application ${params.applicationCode}`);
    } catch (error) {
      this.logger.error(
        `Failed to send interview invitation email to ${toEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
