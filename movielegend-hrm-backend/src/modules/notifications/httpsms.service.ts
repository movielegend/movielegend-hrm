import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HttpSmsService {
  private readonly logger = new Logger(HttpSmsService.name);
  private readonly apiKey: string;
  private readonly fromPhone: string;

  constructor(private configService: ConfigService) {
    this.apiKey = (this.configService.get<string>('app.httpSmsApiKey') ?? '').trim();
    this.fromPhone = (this.configService.get<string>('app.httpSmsFromPhone') ?? '').trim();
  }

  async sendSms(to: string, content: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('HTTPSMS_API_KEY is not configured. Simulating SMS send.');
      this.logger.debug(`[SMS Simulated] To: ${to}, Content: ${content}`);
      return true; // Return true in dev if not configured
    }

    try {
      // httpSMS expects E.164 format. Ensure standard Vietnamese phone format.
      let formattedPhone = to;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }

      const response = await fetch('https://api.httpsms.com/v1/messages/send', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromPhone,
          to: formattedPhone,
          content,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send SMS via httpSMS: ${response.status} ${errorText}`);
        return false;
      }

      const responseData = await response.json();
      this.logger.log(`SMS sent successfully via httpSMS: ${JSON.stringify(responseData)}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending SMS via httpSMS', error);
      return false;
    }
  }
}
